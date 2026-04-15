import 'server-only'

import { randomUUID } from 'node:crypto'
import { ChildProcess, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import type {
  Agent,
  DashboardStats,
  FuzzingFinding,
  LogEntry,
  Report,
  ReportDetail,
  RiskLevel,
  Scan,
  ScanProgress,
  ScanStatus,
  ScanType,
} from '@/lib/types'
import { sanitizeLogEntry, sanitizeLogMessage } from './log-sanitizer'

// 轻量化的报告详情索引，只存储必要字段
type ReportDetailIndex = {
  id: string
  scanId: string
  agentId: string
  agentName?: string
  title?: string
  toolCount?: number
  risk: RiskLevel
  summary: {
    totalFindings: number
    fuzzingFindings: number
    chainToolCount: number
    highRiskChainCount: number
    topRisks: string[]
  }
  createdAt: string
  types: ScanType[]
}

type PersistedState = {
  agents: Agent[]
  scans: Scan[]
  reportDetailIndex: ReportDetailIndex[]
  logs: Record<string, LogEntry[]>
}

type CreateScanPayload = {
  agentId: string
  types: string[]
  params?: Record<string, unknown>
}

type PythonCommand = {
  command: string
  argsPrefix: string[]
}

type MTAtlasMetadataItem = {
  func_signature: string
  description: string
  MCP: string
  code: string
}

type MTAtlasScanParams = {
  metadataText?: string
  metadataFilename?: string
  frameworkLabel?: string
  toolMode?: string
}

type MTAtlasArtifacts = {
  summary: Record<string, unknown>
  normalizedTools: { tools?: Array<Record<string, unknown>> }
  sinkTools: { sink_tools?: Array<Record<string, unknown>> }
  dependencyEdges: { edges?: Array<Record<string, unknown>> }
  candidateChains: { chains?: Array<Record<string, unknown>> }
  filteredCandidateChains: {
    accepted?: Array<Record<string, unknown>>
    rejected?: Array<Record<string, unknown>>
  }
  sourceRiskReport: { chains?: Array<Record<string, unknown>> }
  reportMarkdown: string
}

type ReportDownload = {
  filename: string
  contentType: string
  data: Buffer
}

const FRONTEND_ROOT = process.cwd()
const PROJECT_ROOT = path.resolve(FRONTEND_ROOT, '..')
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend', 'MTAtlas')
const DATA_ROOT = path.join(PROJECT_ROOT, 'backend', 'MTAtlas', 'data')
const WORKSPACES_ROOT = path.join(DATA_ROOT, 'workspaces')
const STATE_FILE = path.join(DATA_ROOT, 'mtatlas-state.json')
const REPORT_DETAILS_DIR = path.join(DATA_ROOT, 'report-details')
const DEFAULT_AGENT_ID = 'mtatlas-default'
const HIGH_RISK_SINK_TYPES = new Set(['CMDi', 'RCE', 'SQLi', 'SSTI', 'TemplateInjection', 'CodeInjection'])
const MEDIUM_RISK_SINK_TYPES = new Set(['SSRF', 'PathTraversal', 'FileWrite', 'FileRead', 'DataExfiltration'])
const STATE_CACHE_TTL_MS = 5_000

declare global {
  // eslint-disable-next-line no-var
  var __mtatlasProcessRegistry: Map<string, ChildProcess> | undefined
  // eslint-disable-next-line no-var
  var __mtatlasMutationQueue: Promise<unknown> | undefined
  // eslint-disable-next-line no-var
  var __mtatlasStateCache: { expiresAt: number; state: PersistedState } | undefined
}

const processRegistry = globalThis.__mtatlasProcessRegistry ?? new Map<string, ChildProcess>()
globalThis.__mtatlasProcessRegistry = processRegistry

function nowIso() {
  return new Date().toISOString()
}

function createEmptyState(): PersistedState {
  return {
    agents: [],
    scans: [],
    reportDetailIndex: [],
    logs: {},
  }
}

function getWorkspaceParent(scanId: string) {
  return path.join(WORKSPACES_ROOT, scanId)
}

function getWorkspaceRoot(scanId: string) {
  return path.join(getWorkspaceParent(scanId), 'mtatlas')
}

function getArtifactRoot(scanId: string) {
  return path.join(getWorkspaceRoot(scanId), 'artifacts')
}

function getFrameworkLabel(scan: Scan) {
  const params = (scan.params ?? {}) as MTAtlasScanParams
  const raw = typeof params.frameworkLabel === 'string' && params.frameworkLabel.trim() ? params.frameworkLabel : `scan_${scan.id.slice(0, 8)}`
  return raw.replace(/[^a-zA-Z0-9_-]+/g, '_')
}

function getScanParams(scan: Scan): MTAtlasScanParams {
  return (scan.params ?? {}) as MTAtlasScanParams
}

async function ensureStateRoot() {
  await fs.mkdir(DATA_ROOT, { recursive: true })
}

function getReportDetailFilePath(reportId: string) {
  return path.join(REPORT_DETAILS_DIR, `${reportId}.json`)
}

async function ensureReportDetailsDir() {
  await fs.mkdir(REPORT_DETAILS_DIR, { recursive: true })
}

async function loadReportDetailFromFile(reportId: string): Promise<ReportDetail | null> {
  const filePath = getReportDetailFilePath(reportId)
  try {
    return await readJsonFile<ReportDetail>(filePath, null as unknown as ReportDetail)
  } catch {
    return null
  }
}

async function saveReportDetailToFile(report: ReportDetail): Promise<void> {
  await ensureReportDetailsDir()
  const filePath = getReportDetailFilePath(report.id)
  await writeJsonFile(filePath, report)
}

async function migrateReportDetailsIfNeeded(state: PersistedState): Promise<PersistedState> {
  // 检查是否需要迁移（旧格式有 reportDetails 数组）
  const legacyReportDetails = (state as unknown as { reportDetails?: ReportDetail[] }).reportDetails
  if (legacyReportDetails && legacyReportDetails.length > 0) {
    console.log(`[MTAtlas] Migrating ${legacyReportDetails.length} reportDetails to separate files...`)
    await ensureReportDetailsDir()

    const newIndex: ReportDetailIndex[] = []
    for (const report of legacyReportDetails) {
      // 保存到单独文件
      await saveReportDetailToFile(report)
      // 添加到索引
      newIndex.push({
        id: report.id,
        scanId: report.scanId,
        agentId: report.agentId,
        agentName: report.agentName,
        title: report.title,
        toolCount: report.toolCount,
        risk: report.risk,
        summary: {
          totalFindings: report.summary?.totalFindings ?? 0,
          fuzzingFindings: report.summary?.fuzzingFindings ?? report.fuzzing?.findings.length ?? 0,
          chainToolCount: report.summary?.chainToolCount ?? 0,
          highRiskChainCount: report.fuzzing?.findings.filter((f) => f.severity === 'high').length ?? 0,
          topRisks: report.fuzzing?.findings.filter((f) => f.severity === 'high').slice(0, 2).map((f) => f.title) ?? [],
        },
        createdAt: report.createdAt,
        types: report.types,
      })
    }

    // 更新状态，移除旧的 reportDetails
    state.reportDetailIndex = newIndex
    ;(state as unknown as { reportDetails?: unknown }).reportDetails = undefined

    // 保存迁移后的状态
    await saveState(state)
    console.log(`[MTAtlas] Migration complete. State file should be much smaller now.`)
  }

  return state
}

function invalidateStateCache() {
  globalThis.__mtatlasStateCache = undefined
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}

async function readTextFile(filePath: string, fallback = '') {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function countDemoTools() {
  const tools = await readJsonFile<Array<Record<string, unknown>>>(
    path.join(BACKEND_ROOT, 'inputs', 'static_pure', 'demo_tools.json'),
    []
  )
  const sinkTools = await readJsonFile<{ sink_tools?: Array<Record<string, unknown>> }>(
    path.join(BACKEND_ROOT, 'artifacts', 'demo_static_pure', 'static_pure', 'sink_tools.json'),
    {}
  )

  return {
    total: tools.length,
    highRisk: sinkTools.sink_tools?.length ?? 0,
  }
}

async function buildDefaultAgent(): Promise<Agent> {
  const timestamp = nowIso()
  const stats = await countDemoTools()

  return {
    id: DEFAULT_AGENT_ID,
    name: 'MTAtlas Composite Vulnerability Detection',
    version: '1.0',
    description: 'Runs MTAtlas static-pure analysis over uploaded Agent function metadata to detect multi-tool vulnerability chains.',
    tags: ['mtatlas', 'fuzzing', 'static-pure', 'metadata'],
    inputType: 'spec_upload',
    specFilename: 'Tool metadata JSON',
    createdAt: timestamp,
    updatedAt: timestamp,
    toolCount: stats.total,
    highRiskToolCount: stats.highRisk,
  }
}

async function hydrateState(state: PersistedState) {
  const builtin = await buildDefaultAgent()
  const index = state.agents.findIndex((agent) => agent.id === DEFAULT_AGENT_ID)

  if (index === -1) {
    state.agents.unshift(builtin)
    return state
  }

  const current = state.agents[index]
  state.agents[index] = {
    ...current,
    ...builtin,
    createdAt: current.createdAt || builtin.createdAt,
    updatedAt: current.updatedAt || builtin.updatedAt,
    lastScanAt: current.lastScanAt,
  }

  return state
}

async function loadState() {
  const cached = globalThis.__mtatlasStateCache
  if (cached && cached.expiresAt > Date.now()) {
    return cached.state
  }

  await ensureStateRoot()
  const state = await readJsonFile<PersistedState>(STATE_FILE, createEmptyState())
  // 迁移旧的 reportDetails 到单独文件（只执行一次）
  const migrated = await migrateReportDetailsIfNeeded(state)
  const hydrated = await hydrateState(migrated)
  globalThis.__mtatlasStateCache = {
    expiresAt: Date.now() + STATE_CACHE_TTL_MS,
    state: hydrated,
  }
  return hydrated
}

async function saveState(state: PersistedState) {
  await writeJsonFile(STATE_FILE, state)
  invalidateStateCache()
}

async function mutateState<T>(mutator: (state: PersistedState) => Promise<T> | T): Promise<T> {
  let result: T | undefined

  const nextQueue = (globalThis.__mtatlasMutationQueue ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const state = await loadState()
      invalidateStateCache()
      result = await mutator(state)
      await saveState(state)
    })

  globalThis.__mtatlasMutationQueue = nextQueue
  await nextQueue

  return result as T
}

function sortByCreatedDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function validateScanTypes(types: string[]): ScanType[] {
  if (!Array.isArray(types) || types.length === 0) {
    throw new Error('At least one scan type is required.')
  }

  const normalized = Array.from(new Set(types)) as ScanType[]
  if (normalized.length !== 1 || normalized[0] !== 'fuzzing') {
    throw new Error('MTAtlas supports only the fuzzing scan type.')
  }

  return normalized
}

function normalizeMetadataItem(input: Record<string, unknown>): MTAtlasMetadataItem {
  const func_signature =
    typeof input.func_signature === 'string'
      ? input.func_signature
      : typeof input.function_name === 'string'
      ? input.function_name
      : typeof input.name === 'string'
      ? input.name
      : ''

  const description =
    typeof input.description === 'string'
      ? input.description
      : typeof input.summary === 'string'
      ? input.summary
      : ''

  const MCP =
    typeof input.MCP === 'string'
      ? input.MCP
      : typeof input.mcp === 'string'
      ? input.mcp
      : typeof input.server === 'string'
      ? input.server
      : ''

  const code =
    typeof input.code === 'string'
      ? input.code
      : typeof input.implementation === 'string'
      ? input.implementation
      : ''

  // 要求 func_signature、MCP、code 中至少有一个不为空，description 可以为空
  if (!func_signature && !MCP && !code) {
    throw new Error('Each metadata item must contain at least one of: func_signature, MCP, or code.')
  }

  return {
    func_signature: func_signature.trim(),
    description: description.trim(),
    MCP: MCP.trim() || 'Uploaded',
    code,
  }
}

function parseMetadataInput(raw: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Metadata JSON is invalid.')
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).tools)
    ? ((parsed as Record<string, unknown>).tools as unknown[])
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).metadata)
    ? ((parsed as Record<string, unknown>).metadata as unknown[])
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).functions)
    ? ((parsed as Record<string, unknown>).functions as unknown[])
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)
    ? ((parsed as Record<string, unknown>).items as unknown[])
    : null

  if (!list) {
    throw new Error('Metadata must be a JSON array or contain a tools/metadata/functions/items array.')
  }

  const normalized = list.map((item) => normalizeMetadataItem(item as Record<string, unknown>))
  if (normalized.length === 0) {
    throw new Error('Metadata list cannot be empty.')
  }

  return normalized
}

function resolvePythonCommand(): PythonCommand {
  const candidates: PythonCommand[] = process.env.MTATLAS_PYTHON
    ? [{ command: process.env.MTATLAS_PYTHON, argsPrefix: [] }]
    : process.env.AGENTRAFT_PYTHON
    ? [{ command: process.env.AGENTRAFT_PYTHON, argsPrefix: [] }]
    : [
        { command: 'python', argsPrefix: [] },
        { command: 'py', argsPrefix: ['-3'] },
      ]

  for (const candidate of candidates) {
    const probeArgs = candidate.command === 'py' ? ['-3', '--version'] : ['--version']
    try {
      const probe = spawnSync(candidate.command, probeArgs, { timeout: 5000, windowsHide: true })
      if (probe.status === 0) {
        return candidate
      }
    } catch {}
  }

  throw new Error('No usable Python runtime was found. Install Python or set MTATLAS_PYTHON.')
}

function createProgress(stage: ScanProgress['stage'], percent: number, message?: string): ScanProgress {
  return { stage, percent, message }
}

function truncateLogMessage(message: string, limit = 800) {
  const compact = message.replace(/\s+/g, ' ').trim()
  if (compact.length <= limit) {
    return compact
  }
  return `${compact.slice(0, limit)}...`
}

async function appendLog(scanId: string, level: LogEntry['level'], message: string) {
  return mutateState((state) => {
    const sanitizedMessage = sanitizeLogMessage(message, {
      projectRoot: PROJECT_ROOT,
      workspaceRoot: getWorkspaceRoot(scanId),
      userHome: os.homedir(),
    })

    state.logs[scanId] = state.logs[scanId] ?? []
    state.logs[scanId].push({
      id: randomUUID(),
      timestamp: nowIso(),
      level,
      message: truncateLogMessage(sanitizedMessage),
    })
  })
}

async function setScanStatus(id: string, status: ScanStatus, progress?: ScanProgress, extra?: Partial<Scan>) {
  return mutateState((state) => {
    const index = state.scans.findIndex((scan) => scan.id === id)
    if (index === -1) {
      throw new Error('Scan not found.')
    }

    state.scans[index] = {
      ...state.scans[index],
      ...extra,
      status,
      progress: progress ?? state.scans[index].progress,
    }

    return state.scans[index]
  })
}

async function persistReportDetail(report: ReportDetail) {
  // 保存到单独文件
  await saveReportDetailToFile(report)

  // 同时更新状态文件中的索引
  await mutateState((state) => {
    state.reportDetailIndex = state.reportDetailIndex.filter((item) => item.scanId !== report.scanId)
    state.reportDetailIndex.unshift({
      id: report.id,
      scanId: report.scanId,
      agentId: report.agentId,
      agentName: report.agentName,
      title: report.title,
      toolCount: report.toolCount,
      risk: report.risk,
      summary: {
        totalFindings: report.summary?.totalFindings ?? 0,
        fuzzingFindings: report.summary?.fuzzingFindings ?? report.fuzzing?.findings.length ?? 0,
        chainToolCount: report.summary?.chainToolCount ?? 0,
        highRiskChainCount: report.fuzzing?.findings.filter((f) => f.severity === 'high').length ?? 0,
        topRisks: report.fuzzing?.findings.filter((f) => f.severity === 'high').slice(0, 2).map((f) => f.title) ?? [],
      },
      createdAt: report.createdAt,
      types: report.types,
    })
    return report
  })
}

async function prepareWorkspace(scan: Scan, metadata: MTAtlasMetadataItem[]) {
  const workspaceParent = getWorkspaceParent(scan.id)
  const workspaceRoot = getWorkspaceRoot(scan.id)
  const inputRoot = path.join(workspaceRoot, 'input')
  const inputFile = path.join(inputRoot, 'tools.json')

  await fs.rm(workspaceParent, { recursive: true, force: true })
  await fs.mkdir(inputRoot, { recursive: true })
  await fs.mkdir(getArtifactRoot(scan.id), { recursive: true })
  await writeJsonFile(inputFile, { tools: metadata })

  return {
    workspaceRoot,
    inputFile,
    artifactRoot: getArtifactRoot(scan.id),
    frameworkLabel: getFrameworkLabel(scan),
  }
}

async function readArtifactsForScan(scan: Scan): Promise<MTAtlasArtifacts> {
  const artifactDir = path.join(getArtifactRoot(scan.id), getFrameworkLabel(scan), 'static_pure')

  return {
    summary: await readJsonFile(path.join(artifactDir, 'summary.json'), {}),
    normalizedTools: await readJsonFile(path.join(artifactDir, 'normalized_tools.json'), {}),
    sinkTools: await readJsonFile(path.join(artifactDir, 'sink_tools.json'), {}),
    dependencyEdges: await readJsonFile(path.join(artifactDir, 'dependency_edges.json'), {}),
    candidateChains: await readJsonFile(path.join(artifactDir, 'candidate_chains.json'), {}),
    filteredCandidateChains: await readJsonFile(path.join(artifactDir, 'filtered_candidate_chains.json'), {}),
    sourceRiskReport: await readJsonFile(path.join(artifactDir, 'source_risk_report.json'), {}),
    reportMarkdown: await readTextFile(path.join(artifactDir, 'report.md')),
  }
}

function getSinkSeverity(sinkType: string): FuzzingFinding['severity'] {
  if (HIGH_RISK_SINK_TYPES.has(sinkType)) {
    return 'high'
  }
  if (MEDIUM_RISK_SINK_TYPES.has(sinkType)) {
    return 'medium'
  }
  return 'low'
}

function summarizeRisk(findings: FuzzingFinding[]): RiskLevel {
  if (findings.some((finding) => finding.severity === 'high')) {
    return 'high'
  }
  if (findings.some((finding) => finding.severity === 'medium')) {
    return 'medium'
  }
  if (findings.length > 0) {
    return 'low'
  }
  return 'unknown'
}

function buildFuzzingFinding(
  chain: Record<string, unknown>,
  sinkRecord: Record<string, unknown> | undefined,
  relatedEdges: Array<Record<string, unknown>>
): FuzzingFinding {
  const tools = Array.isArray(chain.tools) ? chain.tools.map((item) => String(item)) : []
  const sinkTool = typeof chain.sink_tool === 'string' ? chain.sink_tool : tools[tools.length - 1] || 'unknown_sink'
  const sinkType = typeof chain.sink_type === 'string' ? chain.sink_type : 'Unknown'
  const boundary = (chain.recommended_boundary ?? {}) as Record<string, unknown>
  const userRisk = (chain.user_source_risk ?? {}) as Record<string, unknown>
  const envRisk = (chain.environment_source_risk ?? {}) as Record<string, unknown>
  const severity = getSinkSeverity(sinkType)

  const boundaryLabel =
    typeof boundary.type === 'string' && boundary.type !== 'none'
      ? `${boundary.type} @ ${String(boundary.tool || '')}:${String(boundary.field_or_resource || '')}`
      : 'No explicit ingress boundary'

  return {
    id: randomUUID(),
    severity,
    title: `${sinkTool} forms a plausible ${sinkType} chain`,
    description:
      typeof chain.chain_display_with_mcp === 'string'
        ? chain.chain_display_with_mcp
        : typeof chain.chain_display === 'string'
        ? chain.chain_display
        : tools.join(' -> '),
    toolName: sinkTool,
    toolSignature: tools.join(' -> '),
    detectionInfo: `Boundary: ${boundaryLabel}`,
    attackType: sinkType,
    payloadSummary: `Accepted chain: ${typeof chain.chain_display === 'string' ? chain.chain_display : tools.join(' -> ')}`,
    reproductionSteps: [
      'Upload complete function metadata JSON.',
      'Run MTAtlas static-pure analysis.',
      'Inspect accepted chains, dependency sites, and sink evidence.',
    ].join('\n'),
    trace: tools,
    evidence: JSON.stringify(
      {
        chain,
        sink: sinkRecord ?? null,
        dependency_edges: relatedEdges,
        user_source_risk: userRisk,
        environment_source_risk: envRisk,
      },
      null,
      2
    ),
  }
}

function buildOverview(artifacts: MTAtlasArtifacts, findings: FuzzingFinding[]) {
  const summary = artifacts.summary
  const toolCount = typeof summary.tool_count === 'number' ? summary.tool_count : 0
  const accepted = typeof summary.accepted_chain_count === 'number' ? summary.accepted_chain_count : findings.length
  const sinks = typeof summary.sink_tools === 'number' ? summary.sink_tools : artifacts.sinkTools.sink_tools?.length ?? 0

  return [
    `MTAtlas analyzed ${toolCount} tools in static-pure mode.`,
    `${sinks} sink tools and ${accepted} accepted candidate chains were retained after filtering.`,
    findings.length > 0
      ? `The report contains ${findings.length} plausible composition-risk chains.`
      : 'No plausible composition-risk chain was retained in this run.',
  ]
}

function buildRecommendations(findings: FuzzingFinding[]) {
  const hasCommand = findings.some((item) => item.attackType === 'CMDi')
  const hasFileOrPath = findings.some((item) => item.attackType === 'PathTraversal' || item.attackType === 'FileWrite')

  return [
    'Constrain high-impact sink tools with explicit allowlists and precondition checks.',
    hasCommand ? 'Block free-form file paths and command fragments from flowing into shell-execution sinks.' : 'Review sink tools for cross-tool argument binding assumptions.',
    hasFileOrPath
      ? 'Separate file persistence tools from execution tools unless the planner can prove a trusted path policy.'
      : 'Review accepted chains and break unnecessary tool-to-tool dependencies.',
  ]
}

async function buildReportDetail(scan: Scan, agent: Agent): Promise<ReportDetail> {
  const artifacts = await readArtifactsForScan(scan)
  const sourceRiskChains = Array.isArray(artifacts.sourceRiskReport.chains) ? artifacts.sourceRiskReport.chains : []
  const sinkRecords = new Map(
    (artifacts.sinkTools.sink_tools ?? []).map((item) => [String(item.tool_name || ''), item as Record<string, unknown>])
  )
  const dependencyEdges = (artifacts.dependencyEdges.edges ?? []) as Array<Record<string, unknown>>

  const findings = sourceRiskChains.map((chain) => {
    const sinkTool = typeof chain.sink_tool === 'string' ? chain.sink_tool : ''
    const relatedEdges = dependencyEdges.filter(
      (edge) =>
        edge.source_tool === sinkTool ||
        edge.target_tool === sinkTool ||
        (Array.isArray(chain.tools) &&
          chain.tools.some((tool) => edge.source_tool === tool || edge.target_tool === tool))
    )
    return buildFuzzingFinding(chain, sinkRecords.get(sinkTool), relatedEdges)
  })

  return {
    id: randomUUID(),
    agentId: scan.agentId,
    agentName: agent.name,
    title: scan.title || agent.name,
    toolCount: typeof artifacts.summary.tool_count === 'number' ? artifacts.summary.tool_count : 0,
    scanId: scan.id,
    createdAt: nowIso(),
    types: ['fuzzing'],
    risk: summarizeRisk(findings),
    summary: {
      totalFindings: findings.length,
      fuzzingFindings: findings.length,
      chainToolCount: findings.length,
      highRiskChainCount: findings.filter((f) => f.severity === 'high').length,
      topRisks: findings.filter((f) => f.severity === 'high').slice(0, 2).map((f) => f.title),
    },
    overviewText: buildOverview(artifacts, findings),
    fuzzing: {
      findings,
      stats: {
        high: findings.filter((item) => item.severity === 'high').length,
        medium: findings.filter((item) => item.severity === 'medium').length,
        low: findings.filter((item) => item.severity === 'low').length,
      },
    },
    recommendations: buildRecommendations(findings),
    raw: {
      mtatlas: artifacts,
    },
  }
}

async function executeScan(scanId: string) {
  const state = await loadState()
  const scan = state.scans.find((item) => item.id === scanId)
  if (!scan) {
    return
  }

  const agent = state.agents.find((item) => item.id === scan.agentId)
  if (!agent) {
    await appendLog(scanId, 'error', 'The selected MTAtlas target no longer exists.')
    await setScanStatus(scanId, 'failed', createProgress('parse', 0, 'Target is missing.'))
    return
  }

  const params = getScanParams(scan)
  if (!params.metadataText?.trim()) {
    await appendLog(scanId, 'error', 'No metadata JSON was provided.')
    await setScanStatus(scanId, 'failed', createProgress('parse', 0, 'Missing metadata JSON.'))
    return
  }

  try {
    const metadata = parseMetadataInput(params.metadataText)
    const python = resolvePythonCommand()

    await setScanStatus(scanId, 'running', createProgress('parse', 8, 'Parsing uploaded function metadata.'), {
      startedAt: nowIso(),
    })
    await appendLog(scanId, 'info', `Parsed ${metadata.length} metadata entries for MTAtlas.`)

    const workspace = await prepareWorkspace(scan, metadata)
    await setScanStatus(scanId, 'running', createProgress('precheck', 24, 'Prepared MTAtlas workspace and input payload.'))
    await appendLog(scanId, 'info', `Workspace prepared at ${workspace.workspaceRoot}.`)

    const args = [
      ...python.argsPrefix,
      '-m',
      'mtatlas',
      '--mode',
      'static-pure',
      '--input',
      workspace.inputFile,
      '--framework',
      workspace.frameworkLabel,
      '--artifact-root',
      workspace.artifactRoot,
    ]

    await setScanStatus(scanId, 'running', createProgress('run', 52, 'Running MTAtlas static-pure analysis.'))
    await appendLog(scanId, 'info', `Executing: ${python.command} ${args.join(' ')}`)

    await new Promise<void>((resolve, reject) => {
      const child = spawn(python.command, args, {
        cwd: BACKEND_ROOT,
        windowsHide: true,
        env: {
          ...process.env,
          PYTHONUTF8: '1',
        },
      })

      processRegistry.set(scanId, child)

      child.stdout?.on('data', (chunk: Buffer | string) => {
        const text = String(chunk).trim()
        if (text) {
          void appendLog(scanId, 'info', text)
        }
      })

      child.stderr?.on('data', (chunk: Buffer | string) => {
        const text = String(chunk).trim()
        if (text) {
          void appendLog(scanId, text.toLowerCase().includes('traceback') ? 'error' : 'warn', text)
        }
      })

      child.on('error', reject)
      child.on('close', (code) => {
        processRegistry.delete(scanId)
        if (code === 0) {
          resolve()
          return
        }
        reject(new Error(`MTAtlas exited with code ${code ?? 'unknown'}.`))
      })
    })

    const currentScan = await getScan(scanId)
    if (currentScan?.status === 'canceled') {
      return
    }

    await setScanStatus(scanId, 'running', createProgress('aggregate', 82, 'Reading MTAtlas artifacts and building report.'))
    const report = await buildReportDetail(scan, agent)
    await persistReportDetail(report)

    await setScanStatus(scanId, 'succeeded', createProgress('done', 100, 'MTAtlas analysis completed.'), {
      finishedAt: nowIso(),
      durationMs: Date.now() - new Date(scan.startedAt ?? scan.createdAt).getTime(),
      reportId: report.id,
      // 更新 summary 字段，供列表页轻量模式使用
      summary: {
        totalFindings: report.summary?.totalFindings ?? 0,
        exposureFindings: 0,
        fuzzingFindings: report.summary?.fuzzingFindings ?? report.fuzzing?.findings.length ?? 0,
        doeToolCount: 0,
        chainToolCount: report.summary?.chainToolCount ?? report.fuzzing?.findings.length ?? 0,
        highRiskExposureCount: 0,
        highRiskChainCount: report.fuzzing?.findings.filter((f) => f.severity === 'high').length ?? 0,
        topRisks: report.fuzzing?.findings.filter((f) => f.severity === 'high').slice(0, 2).map((f) => f.title) ?? [],
      },
    })
    await appendLog(scanId, 'info', 'MTAtlas analysis completed successfully.')
  } catch (error) {
    processRegistry.delete(scanId)
    await appendLog(scanId, 'error', error instanceof Error ? error.message : 'MTAtlas analysis failed.')
    await setScanStatus(scanId, 'failed', createProgress('run', 100, 'MTAtlas analysis failed.'), {
      finishedAt: nowIso(),
      durationMs: Date.now() - new Date(scan.startedAt ?? scan.createdAt).getTime(),
    })
  }
}

function toReportSummary(report: ReportDetail): Report {
  return {
    id: report.id,
    agentId: report.agentId,
    agentName: report.agentName,
    title: report.title,
    toolCount: report.toolCount,
    scanId: report.scanId,
    createdAt: report.createdAt,
    types: report.types,
    risk: report.risk,
    summary: report.summary,
  }
}

function buildSimplePdf(lines: string[]) {
  const body = lines
    .map((line, index) => `BT /F1 11 Tf 48 ${760 - index * 16} Td (${line.replace(/[()\\]/g, '\\$&')}) Tj ET`)
    .join('\n')
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${body.length} >> stream
${body}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000000 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`
  return Buffer.from(pdf, 'utf-8')
}

export async function listAgents() {
  const state = await loadState()
  return state.agents
}

export async function getAgent(id: string) {
  const state = await loadState()
  return state.agents.find((agent) => agent.id === id) ?? null
}

export async function listScans(query?: { agentId?: string; limit?: number; offset?: number }) {
  const state = await loadState()
  let scans = query?.agentId ? state.scans.filter((scan) => scan.agentId === query.agentId) : state.scans
  scans = sortByCreatedDesc(scans)
  if (query?.offset) {
    scans = scans.slice(query.offset)
  }
  if (query?.limit) {
    scans = scans.slice(0, query.limit)
  }
  // 对于已完成的扫描，如果 summary 缺少字段，从 reportDetailIndex 或报告文件补充
  return Promise.all(
    scans.map(async (scan) => {
      if (scan.status !== 'succeeded' || !scan.reportId) {
        return scan
      }

      // 尝试从 reportDetailIndex 获取
      const reportIndex = state.reportDetailIndex.find((r) => r.scanId === scan.id)
      if (reportIndex?.summary?.highRiskChainCount) {
        return {
          ...scan,
          summary: {
            ...scan.summary,
            totalFindings: scan.summary?.totalFindings ?? reportIndex.summary.totalFindings ?? 0,
            fuzzingFindings: scan.summary?.fuzzingFindings ?? reportIndex.summary.fuzzingFindings ?? 0,
            chainToolCount: scan.summary?.chainToolCount ?? reportIndex.summary.chainToolCount ?? 0,
            highRiskChainCount: scan.summary?.highRiskChainCount ?? reportIndex.summary.highRiskChainCount ?? 0,
            topRisks: scan.summary?.topRisks ?? reportIndex.summary.topRisks ?? [],
          },
        }
      }

      // 如果 reportDetailIndex 中没有，直接从报告文件读取
      try {
        const report = await getReportDetail(scan.reportId)
        if (report?.fuzzing?.findings) {
          const highRiskCount = report.fuzzing.findings.filter((f) => f.severity === 'high').length
          return {
            ...scan,
            summary: {
              ...scan.summary,
              totalFindings: report.summary?.totalFindings ?? report.fuzzing.findings.length ?? 0,
              fuzzingFindings: report.summary?.fuzzingFindings ?? report.fuzzing.findings.length ?? 0,
              chainToolCount: report.summary?.chainToolCount ?? report.fuzzing.findings.length ?? 0,
              highRiskChainCount: highRiskCount,
              topRisks: report.fuzzing.findings.filter((f) => f.severity === 'high').slice(0, 2).map((f) => f.title),
            },
          }
        }
      } catch {
        // 如果读取失败，返回原始扫描数据
      }

      return scan
    })
  )
}

export async function getScan(id: string) {
  const state = await loadState()
  return state.scans.find((scan) => scan.id === id) ?? null
}

export async function createScan(payload: CreateScanPayload) {
  const state = await loadState()
  const agent = state.agents.find((item) => item.id === payload.agentId)
  if (!agent) {
    throw new Error('Selected MTAtlas target does not exist.')
  }

  const types = validateScanTypes(payload.types)
  const params = (payload.params ?? {}) as MTAtlasScanParams
  if (!params.metadataText?.trim()) {
    throw new Error('Function metadata JSON is required.')
  }

  const metadata = parseMetadataInput(params.metadataText)

  const scan = await mutateState((draft) => {
    const timestamp = nowIso()
    const entry: Scan = {
      id: randomUUID(),
      agentId: agent.id,
      agentName: agent.name,
      title: typeof payload.params?.taskName === 'string' ? payload.params.taskName : 'MTAtlas Static-Pure Scan',
      types,
      status: 'queued',
      createdAt: timestamp,
      params: {
        ...payload.params,
        frameworkLabel: params.frameworkLabel || undefined,
        toolCount: metadata.length,
        selectedChecks: types,
      },
      progress: createProgress('parse', 0, 'Waiting to start.'),
    }

    draft.scans.unshift(entry)

    const agentIndex = draft.agents.findIndex((item) => item.id === agent.id)
    if (agentIndex !== -1) {
      draft.agents[agentIndex] = {
        ...draft.agents[agentIndex],
        lastScanAt: timestamp,
        updatedAt: timestamp,
      }
    }

    return entry
  })

  await appendLog(scan.id, 'info', 'MTAtlas scan created from uploaded tool metadata.')
  void executeScan(scan.id)
  return scan
}

export async function cancelScanEntry(id: string) {
  const scan = await getScan(id)
  if (!scan) {
    throw new Error('Scan not found.')
  }

  if (scan.status === 'succeeded' || scan.status === 'failed' || scan.status === 'canceled') {
    return scan
  }

  const child = processRegistry.get(id)
  if (child?.pid) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
    } else {
      child.kill('SIGTERM')
    }
  }

  await appendLog(id, 'warn', 'Cancellation requested by user.')
  return setScanStatus(
    id,
    'canceled',
    createProgress(scan.progress?.stage ?? 'run', scan.progress?.percent ?? 0, 'Canceled by user.'),
    {
      finishedAt: nowIso(),
      durationMs: Date.now() - new Date(scan.startedAt ?? scan.createdAt).getTime(),
    }
  )
}

export async function getScanLogs(id: string) {
  const state = await loadState()
  return (state.logs[id] ?? []).map((entry) =>
    sanitizeLogEntry(entry, {
      projectRoot: PROJECT_ROOT,
      workspaceRoot: getWorkspaceRoot(id),
      userHome: os.homedir(),
    })
  )
}

export async function listReports(query?: { agentId?: string; risk?: string; type?: string }) {
  const state = await loadState()
  let reports = state.reportDetailIndex

  if (query?.agentId) {
    reports = reports.filter((report) => report.agentId === query.agentId)
  }
  if (query?.risk) {
    reports = reports.filter((report) => report.risk === query.risk)
  }
  if (query?.type) {
    reports = reports.filter((report) => report.types.includes(query.type as ScanType))
  }

  return sortByCreatedDesc(reports).map((report) => toReportSummary(report as unknown as ReportDetail))
}

export async function getReportDetail(id: string) {
  // 从单独文件读取，不加载整个状态
  return loadReportDetailFromFile(id)
}

export async function downloadReportFile(id: string, format: 'pdf' | 'json' = 'json'): Promise<ReportDownload> {
  const report = await getReportDetail(id)
  if (!report) {
    throw new Error('Report not found.')
  }

  if (format === 'json') {
    return {
      filename: `${id}.json`,
      contentType: 'application/json; charset=utf-8',
      data: Buffer.from(JSON.stringify(report, null, 2), 'utf-8'),
    }
  }

  const lines = [
    `SAFE-Agent Report ${id}`,
    `Agent: ${report.agentName ?? report.agentId}`,
    `Created: ${report.createdAt}`,
    `Risk: ${report.risk}`,
    `Findings: ${report.summary.totalFindings}`,
    ...(report.overviewText ?? []),
    ...((report.recommendations ?? []).map((item) => `Recommendation: ${item}`)),
  ]

  return {
    filename: `${id}.pdf`,
    contentType: 'application/pdf',
    data: buildSimplePdf(lines),
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const state = await loadState()
  return {
    agentCount: state.agents.length,
    recentScanCount: state.scans.length,
    failedScanCount: state.scans.filter((scan) => scan.status === 'failed').length,
    highRiskReportCount: state.reportDetailIndex.filter((report) => report.risk === 'high').length,
  }
}

export const __internal = {
  invalidateStateCache,
}
