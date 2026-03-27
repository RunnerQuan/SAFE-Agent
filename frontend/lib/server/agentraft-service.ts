import 'server-only'

import { randomUUID } from 'node:crypto'
import { ChildProcess, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

import type {
  Agent,
  DashboardStats,
  ExposureFinding,
  LogEntry,
  Report,
  ReportDetail,
  RiskLevel,
  Scan,
  ScanProgress,
  ScanStatus,
  ScanType,
} from '@/lib/types'

type PersistedState = {
  agents: Agent[]
  scans: Scan[]
  reportDetails: ReportDetail[]
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

type SourceSinkEntry = {
  source: string
  sink: string
  allPaths?: string[][]
}

type PromptVariant = Record<string, unknown>

type GeneratedPromptEntry = {
  source: string
  sink: string
  path?: string[]
  rewriteRes?: {
    userPrompt?: PromptVariant[]
  }
}

type ReportArtifacts = {
  callGraph: unknown[]
  sourceToSinkPaths: SourceSinkEntry[]
  generatedPrompts: GeneratedPromptEntry[]
}

type AgentMetadataItem = {
  func_signature: string
  description: string
  MCP: string
  code: string
}

type AgentRaftScanParams = {
  metadataText?: string
  metadataFilename?: string
  sourceFunctions?: string[]
  sinkFunctions?: string[]
  toolMode?: string
}

type PreparedWorkspace = {
  workspaceRoot: string
  runsRoot: string
  metadata: AgentMetadataItem[]
  effectiveSources: string[]
  effectiveSinks: string[]
}

type ReportDownload = {
  filename: string
  contentType: string
  data: Buffer
}

const FRONTEND_ROOT = process.cwd()
const PROJECT_ROOT = path.resolve(FRONTEND_ROOT, '..')
const BACKEND_ROOT = path.join(PROJECT_ROOT, 'backend', 'agentRaft')
const BACKEND_NODE_ROOT = path.join(BACKEND_ROOT, 'node')
const STATE_ROOT = path.join(FRONTEND_ROOT, '.data')
const WORKSPACES_ROOT = path.join(STATE_ROOT, 'agentraft-workspaces')
const STATE_FILE = path.join(STATE_ROOT, 'agentraft-state.json')
const DEFAULT_AGENT_ID = 'agentraft-default'
const SUPPORTED_SCAN_TYPES: ScanType[] = ['exposure']
const HIGH_RISK_SINKS = new Set(['send_message', 'send_email', 'chrome_fill_or_select'])
const MEDIUM_RISK_SINKS = new Set(['chrome_bookmark_add', 'update_note', 'create_note'])

declare global {
  var __agentRaftProcessRegistry: Map<string, ChildProcess> | undefined
  var __agentRaftMutationQueue: Promise<unknown> | undefined
}

const processRegistry = globalThis.__agentRaftProcessRegistry ?? new Map<string, ChildProcess>()
globalThis.__agentRaftProcessRegistry = processRegistry

function nowIso() {
  return new Date().toISOString()
}

function createEmptyState(): PersistedState {
  return {
    agents: [],
    scans: [],
    reportDetails: [],
    logs: {},
  }
}

function getWorkspaceRoot(scanId: string) {
  return path.join(WORKSPACES_ROOT, scanId, 'agentRaft')
}

function getWorkspaceParent(scanId: string) {
  return path.join(WORKSPACES_ROOT, scanId)
}

function getScanParams(scan: Scan): AgentRaftScanParams {
  return (scan.params ?? {}) as AgentRaftScanParams
}

async function ensureStateRoot() {
  await fs.mkdir(STATE_ROOT, { recursive: true })
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function countBackendTools() {
  let total = 0
  let highRisk = 0

  try {
    const files = await fs.readdir(BACKEND_NODE_ROOT)
    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue
      }

      const entries = await readJsonFile<Array<{ func_signature?: string }>>(path.join(BACKEND_NODE_ROOT, file), [])
      total += entries.length
      highRisk += entries.filter((entry) => entry.func_signature && HIGH_RISK_SINKS.has(entry.func_signature)).length
    }
  } catch {
    return { total: 0, highRisk: 0 }
  }

  return { total, highRisk }
}

async function buildDefaultAgent(): Promise<Agent> {
  const toolStats = await countBackendTools()
  const timestamp = nowIso()

  return {
    id: DEFAULT_AGENT_ID,
    name: 'AgentRaft Data Over-Exposure',
    version: '1.0',
    description: 'Reads Agent function metadata and runs data over-exposure analysis through AgentRaft.',
    tags: ['agentRaft', 'exposure', 'metadata'],
    inputType: 'spec_upload',
    specFilename: 'Agent metadata JSON',
    createdAt: timestamp,
    updatedAt: timestamp,
    toolCount: toolStats.total,
    highRiskToolCount: toolStats.highRisk,
  }
}

async function hydrateState(state: PersistedState) {
  const defaultAgent = await buildDefaultAgent()
  const index = state.agents.findIndex((agent) => agent.id === DEFAULT_AGENT_ID)

  if (index === -1) {
    state.agents.unshift(defaultAgent)
    return state
  }

  const existing = state.agents[index]
  state.agents[index] = {
    ...existing,
    ...defaultAgent,
    createdAt: existing.createdAt || defaultAgent.createdAt,
    updatedAt: existing.updatedAt || defaultAgent.updatedAt,
    lastScanAt: existing.lastScanAt,
  }

  return state
}

async function loadState() {
  await ensureStateRoot()
  const state = await readJsonFile<PersistedState>(STATE_FILE, createEmptyState())
  return hydrateState(state)
}

async function saveState(state: PersistedState) {
  await writeJsonFile(STATE_FILE, state)
}

async function mutateState<T>(mutator: (state: PersistedState) => Promise<T> | T): Promise<T> {
  let result: T | undefined

  const nextQueue = (globalThis.__agentRaftMutationQueue ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const state = await loadState()
      result = await mutator(state)
      await saveState(state)
    })

  globalThis.__agentRaftMutationQueue = nextQueue
  await nextQueue

  return result as T
}

function sortByCreatedDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function toReportSummary(report: ReportDetail): Report {
  return {
    id: report.id,
    agentId: report.agentId,
    agentName: report.agentName,
    scanId: report.scanId,
    createdAt: report.createdAt,
    types: report.types,
    risk: report.risk,
    summary: report.summary,
  }
}

function normalizeMetadataItem(input: Record<string, unknown>): AgentMetadataItem {
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
      : typeof input.desc === 'string'
      ? input.desc
      : typeof input.summary === 'string'
      ? input.summary
      : ''

  const MCP =
    typeof input.MCP === 'string'
      ? input.MCP
      : typeof input.mcp === 'string'
      ? input.mcp
      : typeof input.tool === 'string'
      ? input.tool
      : typeof input.server === 'string'
      ? input.server
      : 'Uploaded'

  const code =
    typeof input.code === 'string'
      ? input.code
      : typeof input.implementation === 'string'
      ? input.implementation
      : typeof input.impl === 'string'
      ? input.impl
      : ''

  if (!func_signature || !code) {
    throw new Error('Each metadata item must contain at least func_signature and code.')
  }

  return {
    func_signature,
    description,
    MCP,
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
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).metadata)
    ? ((parsed as Record<string, unknown>).metadata as unknown[])
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).functions)
    ? ((parsed as Record<string, unknown>).functions as unknown[])
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).items)
    ? ((parsed as Record<string, unknown>).items as unknown[])
    : null

  if (!list) {
    throw new Error('Metadata must be a JSON array or contain a metadata/functions/items array.')
  }

  const normalized = list.map((item) => normalizeMetadataItem(item as Record<string, unknown>))
  if (normalized.length === 0) {
    throw new Error('Metadata list cannot be empty.')
  }

  return normalized
}

function getPromptLines(variant: PromptVariant) {
  const key = Object.keys(variant).find((item) => /^res\d+$/.test(item))
  if (!key) {
    return []
  }

  const value = variant[key]
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function getFineGrainItems(variants: PromptVariant[]) {
  return variants
    .map((variant) => variant.fine_grain_item)
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getSeverityFromSink(sink: string): ExposureFinding['severity'] {
  if (HIGH_RISK_SINKS.has(sink)) {
    return 'high'
  }

  if (MEDIUM_RISK_SINKS.has(sink)) {
    return 'medium'
  }

  return 'low'
}

function summarizeRisk(findings: ExposureFinding[]): RiskLevel {
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

function buildPromptFinding(entry: GeneratedPromptEntry, index: number): ExposureFinding {
  const variants = Array.isArray(entry.rewriteRes?.userPrompt) ? entry.rewriteRes.userPrompt : []
  const fineGrainItems = getFineGrainItems(variants)
  const samplePrompts = variants.flatMap(getPromptLines)
  const severity = getSeverityFromSink(entry.sink)

  return {
    id: `finding-${index + 1}`,
    severity,
    title: `Executable exposure path: ${entry.source} -> ${entry.sink}`,
    description: `The backend generated ${variants.length} prompt variants for this source-to-sink path, which indicates that the path is practically triggerable.`,
    evidence: JSON.stringify(
      {
        source: entry.source,
        sink: entry.sink,
        path: entry.path ?? [],
        fineGrainItems,
        samplePrompts: samplePrompts.slice(0, 6),
      },
      null,
      2
    ),
    dataType: fineGrainItems[0] || 'unlabeled',
    source: entry.source,
    sinks: [entry.sink],
    flowPath: entry.path ?? [],
  }
}

function buildFallbackFinding(entry: SourceSinkEntry, pathIndex: number, flowPath: string[]): ExposureFinding {
  return {
    id: `fallback-${pathIndex + 1}`,
    severity: getSeverityFromSink(entry.sink),
    title: `Potential exposure path: ${entry.source} -> ${entry.sink}`,
    description: 'A source-to-sink path was found even though no prompt generation output was available for it.',
    evidence: JSON.stringify(
      {
        source: entry.source,
        sink: entry.sink,
        path: flowPath,
      },
      null,
      2
    ),
    dataType: 'manual-review',
    source: entry.source,
    sinks: [entry.sink],
    flowPath,
  }
}

function buildOverview(artifacts: ReportArtifacts, findings: ExposureFinding[]) {
  const uniqueSources = new Set(findings.map((finding) => finding.source).filter(Boolean))
  const uniqueSinks = new Set(findings.flatMap((finding) => finding.sinks ?? []))

  return [
    `Found ${findings.length} exposure findings in this run.`,
    `Sources involved: ${uniqueSources.size}. Sinks involved: ${uniqueSinks.size}.`,
    `Call graph edges: ${artifacts.callGraph.length}. Source-to-sink groups: ${artifacts.sourceToSinkPaths.length}.`,
  ]
}

function buildRecommendations(findings: ExposureFinding[]) {
  const recommendations = [
    'Apply field-level allowlists before data reaches write or send sinks.',
    'Add structured redaction between source tools and external-action tools.',
    'Require explicit confirmation for message, email, and browser form sinks.',
  ]

  if (findings.some((finding) => finding.severity === 'high')) {
    recommendations.unshift('Review all external-action sinks first, especially send and fill operations.')
  }

  return recommendations
}

async function readArtifactsForScan(scanId: string): Promise<ReportArtifacts> {
  const runsRoot = path.join(getWorkspaceRoot(scanId), 'runs')

  const [callGraph, sourceToSinkPaths, generatedPrompts] = await Promise.all([
    readJsonFile<unknown[]>(path.join(runsRoot, 'callGraph.json'), []),
    readJsonFile<SourceSinkEntry[]>(path.join(runsRoot, 'source_to_sink_path.json'), []),
    readJsonFile<GeneratedPromptEntry[]>(path.join(runsRoot, 'generated_prompt.json'), []),
  ])

  return {
    callGraph,
    sourceToSinkPaths,
    generatedPrompts,
  }
}

async function buildReportDetail(scan: Scan, agent: Agent): Promise<ReportDetail> {
  const artifacts = await readArtifactsForScan(scan.id)
  const promptFindings = artifacts.generatedPrompts.map(buildPromptFinding)
  const fallbackFindings =
    promptFindings.length === 0
      ? artifacts.sourceToSinkPaths.flatMap((entry) =>
          (entry.allPaths ?? []).map((flowPath, index) => buildFallbackFinding(entry, index, flowPath))
        )
      : []
  const findings = promptFindings.length > 0 ? promptFindings : fallbackFindings

  return {
    id: randomUUID(),
    agentId: scan.agentId,
    agentName: agent.name,
    scanId: scan.id,
    createdAt: nowIso(),
    types: ['exposure'],
    risk: summarizeRisk(findings),
    summary: {
      totalFindings: findings.length,
      exposureFindings: findings.length,
    },
    overviewText: buildOverview(artifacts, findings),
    exposure: {
      findings,
      flowGraph: artifacts.callGraph,
    },
    recommendations: buildRecommendations(findings),
    raw: artifacts,
  }
}

async function clearRunArtifacts(runsRoot: string) {
  const files = ['callGraph.json', 'source_to_sink_path.json', 'generated_prompt.json', 'LLM_voting_result.json']
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(path.join(runsRoot, file))
      } catch {}
    })
  )
}

function resolvePythonCommand(): PythonCommand {
  const candidates: PythonCommand[] = process.env.AGENTRAFT_PYTHON
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
    } catch {
      continue
    }
  }

  throw new Error('No usable Python runtime was found. Install Python or set AGENTRAFT_PYTHON.')
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
    const entry: LogEntry = {
      id: randomUUID(),
      timestamp: nowIso(),
      level,
      message: truncateLogMessage(message),
    }

    state.logs[scanId] = [...(state.logs[scanId] ?? []), entry]
    return entry
  })
}

async function updateScan(scanId: string, updater: (scan: Scan) => Scan) {
  return mutateState((state) => {
    const index = state.scans.findIndex((scan) => scan.id === scanId)
    if (index === -1) {
      throw new Error(`Scan ${scanId} was not found.`)
    }

    state.scans[index] = updater(state.scans[index])
    return state.scans[index]
  })
}

async function setScanStatus(scanId: string, status: ScanStatus, progress: ScanProgress, extra?: Partial<Scan>) {
  return updateScan(scanId, (scan) => ({
    ...scan,
    ...extra,
    status,
    progress,
  }))
}

async function isCanceled(scanId: string) {
  const state = await loadState()
  return state.scans.find((scan) => scan.id === scanId)?.status === 'canceled'
}

function normalizeFunctionList(list: unknown) {
  return Array.isArray(list)
    ? list.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function sanitizeMcpName(name: string) {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
  return cleaned || 'Uploaded'
}

async function prepareWorkspaceForScan(scanId: string, params: AgentRaftScanParams): Promise<PreparedWorkspace> {
  if (!params.metadataText || !params.metadataText.trim()) {
    throw new Error('Metadata JSON is required for AgentRaft scans.')
  }

  const metadata = parseMetadataInput(params.metadataText)
  const workspaceParent = getWorkspaceParent(scanId)
  const workspaceRoot = getWorkspaceRoot(scanId)
  const runsRoot = path.join(workspaceRoot, 'runs')
  const nodeRoot = path.join(workspaceRoot, 'node')
  const resourceRoot = path.join(workspaceRoot, 'resources')
  const configPath = path.join(workspaceRoot, 'config.py')

  await fs.rm(workspaceParent, { recursive: true, force: true })
  await fs.mkdir(workspaceParent, { recursive: true })
  await fs.cp(BACKEND_ROOT, workspaceRoot, { recursive: true })

  const existingNodeFiles = await fs.readdir(nodeRoot)
  await Promise.all(
    existingNodeFiles
      .filter((file) => file.endsWith('.json'))
      .map((file) => fs.unlink(path.join(nodeRoot, file)))
  )

  const groupedByMcp = metadata.reduce<Record<string, AgentMetadataItem[]>>((accumulator, item) => {
    const mcp = sanitizeMcpName(item.MCP)
    const normalizedItem = {
      ...item,
      MCP: mcp,
    }
    accumulator[mcp] = [...(accumulator[mcp] ?? []), normalizedItem]
    return accumulator
  }, {})

  const mcpList = Object.keys(groupedByMcp)
  const funcConfig = Object.fromEntries(
    mcpList.map((mcp) => [mcp, groupedByMcp[mcp].map((item) => item.func_signature)])
  ) as Record<string, string[]>
  const resourceConfig = Object.fromEntries(mcpList.map((mcp) => [mcp, 'uploaded_default'])) as Record<string, string>
  const allFunctions = metadata.map((item) => item.func_signature)
  const effectiveSources = normalizeFunctionList(params.sourceFunctions)
  const effectiveSinks = normalizeFunctionList(params.sinkFunctions)
  const finalSources = effectiveSources.length > 0 ? effectiveSources : allFunctions
  const finalSinks = effectiveSinks.length > 0 ? effectiveSinks : allFunctions
  const uploadedMetadataName = params.metadataFilename
    ? `uploaded-${sanitizeMcpName(path.basename(params.metadataFilename))}`
    : 'uploaded-metadata.json'

  await Promise.all(
    Object.entries(groupedByMcp).map(([mcp, items]) => writeJsonFile(path.join(nodeRoot, `${mcp}.json`), items))
  )

  await fs.mkdir(resourceRoot, { recursive: true })
  await fs.writeFile(path.join(resourceRoot, 'uploaded_default.yaml'), '{}\n', 'utf-8')
  await fs.mkdir(path.join(runsRoot, 'judgeEdge'), { recursive: true })
  await clearRunArtifacts(runsRoot)

  await writeJsonFile(path.join(workspaceRoot, uploadedMetadataName), metadata)

  const configOverride = `

# SAFE-Agent uploaded metadata override
PROMPT_GENERATE_CONFIG["mcpList"] = ${JSON.stringify(mcpList, null, 2)}
PROMPT_GENERATE_CONFIG["resourceConfig"] = ${JSON.stringify(resourceConfig, null, 2)}
PROMPT_GENERATE_CONFIG["funcConfig"] = ${JSON.stringify(funcConfig, null, 2)}
PROMPT_GENERATE_CONFIG["source"] = ${JSON.stringify(finalSources, null, 2)}
PROMPT_GENERATE_CONFIG["sink"] = ${JSON.stringify(finalSinks, null, 2)}
DOE_DETECT_CONFIG["path_to_agentDojo_runRes"] = DOE_DETECT_CONFIG.get("path_to_agentDojo_runRes") or ""
`

  await fs.appendFile(configPath, configOverride, 'utf-8')

  return {
    workspaceRoot,
    runsRoot,
    metadata,
    effectiveSources: finalSources,
    effectiveSinks: finalSinks,
  }
}

async function streamProcessLogs(scanId: string, chunk: string, level: LogEntry['level']) {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    await appendLog(scanId, level, line)
  }
}

async function runAgentRaftProcess(scanId: string, workspaceRoot: string) {
  const python = resolvePythonCommand()

  await appendLog(scanId, 'info', `Using Python runtime: ${python.command} ${python.argsPrefix.join(' ')}`.trim())

  await new Promise<void>((resolve, reject) => {
    const child = spawn(python.command, [...python.argsPrefix, 'main.py'], {
      cwd: workspaceRoot,
      windowsHide: true,
    })

    processRegistry.set(scanId, child)

    child.stdout.on('data', (chunk) => {
      void streamProcessLogs(scanId, String(chunk), 'info')
    })

    child.stderr.on('data', (chunk) => {
      void streamProcessLogs(scanId, String(chunk), 'warn')
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      processRegistry.delete(scanId)
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`AgentRaft exited with code ${code}.`))
    })
  })
}

async function finalizeSucceededScan(scanId: string, durationMs: number) {
  const report = await mutateState(async (state) => {
    const scanIndex = state.scans.findIndex((scan) => scan.id === scanId)
    if (scanIndex === -1) {
      throw new Error(`Scan ${scanId} was not found.`)
    }

    const scan = state.scans[scanIndex]
    const agent = state.agents.find((item) => item.id === scan.agentId) ?? (await buildDefaultAgent())
    const reportDetail = await buildReportDetail(scan, agent)

    state.reportDetails = [reportDetail, ...state.reportDetails.filter((item) => item.id !== reportDetail.id)]
    state.scans[scanIndex] = {
      ...scan,
      status: 'succeeded',
      progress: createProgress('done', 100, 'Analysis completed.'),
      finishedAt: nowIso(),
      durationMs,
      reportId: reportDetail.id,
    }

    return reportDetail
  })

  await appendLog(scanId, 'info', `Report ${report.id} generated with ${report.summary.totalFindings} finding(s).`)
}

async function executeScan(scanId: string) {
  const startedAt = Date.now()

  try {
    const scan = await getScan(scanId)
    if (!scan) {
      throw new Error(`Scan ${scanId} was not found.`)
    }

    const params = getScanParams(scan)
    await setScanStatus(
      scanId,
      'running',
      createProgress('parse', 10, 'Parsing uploaded function metadata.'),
      { startedAt: nowIso() }
    )
    await appendLog(scanId, 'info', 'Scan accepted. Parsing uploaded metadata.')

    const prepared = await prepareWorkspaceForScan(scanId, params)
    await setScanStatus(scanId, 'running', createProgress('precheck', 28, 'Preparing isolated AgentRaft workspace.'))
    await appendLog(
      scanId,
      'info',
      `Prepared ${prepared.metadata.length} function(s) across ${new Set(prepared.metadata.map((item) => item.MCP)).size} MCP group(s).`
    )
    await appendLog(
      scanId,
      'info',
      `Effective source/sink scope: ${prepared.effectiveSources.length} source(s), ${prepared.effectiveSinks.length} sink(s).`
    )

    if (await isCanceled(scanId)) {
      await appendLog(scanId, 'warn', 'Scan was canceled before execution started.')
      return
    }

    await setScanStatus(scanId, 'running', createProgress('run', 55, 'Running AgentRaft pipeline.'))
    await runAgentRaftProcess(scanId, prepared.workspaceRoot)

    if (await isCanceled(scanId)) {
      await appendLog(scanId, 'warn', 'Scan was canceled during execution.')
      return
    }

    await setScanStatus(scanId, 'running', createProgress('aggregate', 84, 'Aggregating report artifacts.'))
    await finalizeSucceededScan(scanId, Date.now() - startedAt)
  } catch (error) {
    if (await isCanceled(scanId)) {
      const canceledScan = await getScan(scanId)
      if (canceledScan && !canceledScan.finishedAt) {
        await setScanStatus(
          scanId,
          'canceled',
          createProgress(canceledScan.progress?.stage ?? 'run', canceledScan.progress?.percent ?? 0, 'Canceled by user.'),
          {
            finishedAt: nowIso(),
            durationMs: Date.now() - startedAt,
          }
        )
      }
      return
    }

    const message = error instanceof Error ? error.message : 'AgentRaft execution failed.'
    await appendLog(scanId, 'error', message)
    await setScanStatus(scanId, 'failed', createProgress('done', 100, 'Analysis failed.'), {
      finishedAt: nowIso(),
      durationMs: Date.now() - startedAt,
    })
  } finally {
    processRegistry.delete(scanId)
  }
}

function validateScanTypes(types: string[]): ScanType[] {
  if (!Array.isArray(types) || types.length === 0) {
    throw new Error('At least one scan type is required.')
  }

  const normalized = types.filter((type): type is ScanType => SUPPORTED_SCAN_TYPES.includes(type as ScanType))
  if (normalized.length === 0) {
    throw new Error('Only data over-exposure scans are currently supported.')
  }

  return Array.from(new Set(normalized))
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSimplePdf(lines: string[]) {
  const stream = lines
    .slice(0, 28)
    .map((line, index) => {
      const fontSize = index === 0 ? 18 : 11
      const y = 800 - index * 24
      return `BT /F1 ${fontSize} Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`
    })
    .join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${object}\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

export async function listAgents() {
  const state = await loadState()
  return state.agents
}

export async function getAgent(id: string) {
  const state = await loadState()
  return state.agents.find((agent) => agent.id === id) ?? null
}

export async function createAgent(payload: Partial<Agent>) {
  if (!payload.name?.trim()) {
    throw new Error('Agent name is required.')
  }

  const name = payload.name.trim()

  return mutateState(async (state) => {
    const timestamp = nowIso()
    const agent: Agent = {
      id: randomUUID(),
      name,
      version: payload.version,
      description: payload.description,
      tags: payload.tags ?? [],
      inputType: payload.inputType ?? 'endpoint',
      endpointUrl: payload.endpointUrl,
      authType: payload.authType,
      specFilename: payload.specFilename,
      toolCount: payload.toolCount ?? 0,
      highRiskToolCount: payload.highRiskToolCount ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    state.agents.unshift(agent)
    return agent
  })
}

export async function updateAgentEntry(id: string, payload: Partial<Agent>) {
  return mutateState((state) => {
    const index = state.agents.findIndex((agent) => agent.id === id)
    if (index === -1) {
      throw new Error('Agent not found.')
    }

    const current = state.agents[index]
    state.agents[index] = {
      ...current,
      ...payload,
      id: current.id,
      updatedAt: nowIso(),
    }

    return state.agents[index]
  })
}

export async function deleteAgentEntry(id: string) {
  if (id === DEFAULT_AGENT_ID) {
    throw new Error('The built-in AgentRaft target cannot be deleted.')
  }

  return mutateState((state) => {
    if (state.scans.some((scan) => scan.agentId === id)) {
      throw new Error('This agent already has scan history and cannot be deleted.')
    }

    const nextAgents = state.agents.filter((agent) => agent.id !== id)
    if (nextAgents.length === state.agents.length) {
      throw new Error('Agent not found.')
    }

    state.agents = nextAgents
  })
}

export async function listScans(query?: { agentId?: string }) {
  const state = await loadState()
  const scans = query?.agentId ? state.scans.filter((scan) => scan.agentId === query.agentId) : state.scans
  return sortByCreatedDesc(scans)
}

export async function getScan(id: string) {
  const state = await loadState()
  return state.scans.find((scan) => scan.id === id) ?? null
}

export async function createScan(payload: CreateScanPayload) {
  const state = await loadState()
  const agent = state.agents.find((item) => item.id === payload.agentId)
  if (!agent) {
    throw new Error('Selected agent does not exist.')
  }

  const types = validateScanTypes(payload.types)
  const params = (payload.params ?? {}) as AgentRaftScanParams
  if (!params.metadataText?.trim()) {
    throw new Error('Function metadata JSON is required.')
  }

  parseMetadataInput(params.metadataText)

  const scan = await mutateState((draft) => {
    const timestamp = nowIso()
    const entry: Scan = {
      id: randomUUID(),
      agentId: agent.id,
      agentName: agent.name,
      types,
      status: 'queued',
      createdAt: timestamp,
      params: payload.params,
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

  await appendLog(scan.id, 'info', 'Scan created from uploaded Agent metadata.')
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
  return state.logs[id] ?? []
}

export async function listReports(query?: { agentId?: string; risk?: string; type?: string }) {
  const state = await loadState()
  let reports = state.reportDetails

  if (query?.agentId) {
    reports = reports.filter((report) => report.agentId === query.agentId)
  }

  if (query?.risk) {
    reports = reports.filter((report) => report.risk === query.risk)
  }

  if (query?.type) {
    reports = reports.filter((report) => report.types.includes(query.type as ScanType))
  }

  return sortByCreatedDesc(reports).map(toReportSummary)
}

export async function getReportDetail(id: string) {
  const state = await loadState()
  return state.reportDetails.find((report) => report.id === id) ?? null
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
    highRiskReportCount: state.reportDetails.filter((report) => report.risk === 'high').length,
  }
}

export async function testConnection(url: string) {
  if (!url?.trim()) {
    throw new Error('A target URL is required.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual',
    })

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Connection succeeded.' : `Received HTTP ${response.status}.`,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed.',
    }
  } finally {
    clearTimeout(timeout)
  }
}
