import 'server-only'

import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import type {
  Agent,
  DashboardStats,
  IntegratedScanDetail,
  LogEntry,
  Report,
  ReportDetail,
  RiskLevel,
  Scan,
  ScanCheckState,
  ScanProgress,
  ScanStatus,
  ScanSummary,
  ScanType,
} from '@/lib/types'

import * as agentraft from './agentraft-service'
import * as mtatlas from './mtatlas-service'

type CreateScanPayload = {
  agentId?: string
  title?: string
  types: string[]
  params?: Record<string, unknown>
}

type PersistedUnifiedState = {
  scans: UnifiedScanRecord[]
  logs: Record<string, LogEntry[]>
}

type UnifiedScanRecord = {
  id: string
  agentId: string
  agentName: string
  title: string
  createdAt: string
  params?: Record<string, unknown>
  types: ScanType[]
  childScanIds: Partial<Record<ScanType, string>>
}

type ChildData = {
  scan: Scan | null
  report: ReportDetail | null
}

type ChildReaders = {
  exposure: Pick<typeof agentraft, 'getScan' | 'getReportDetail'>
  fuzzing: Pick<typeof mtatlas, 'getScan' | 'getReportDetail'>
}

const FRONTEND_ROOT = process.cwd()
const STATE_ROOT = path.join(FRONTEND_ROOT, '.data')
const STATE_FILE = path.join(STATE_ROOT, 'unified-scan-state.json')
const AGENTRAFT_DEFAULT_AGENT_ID = 'agentraft-default'
const MTATLAS_DEFAULT_AGENT_ID = 'mtatlas-default'

declare global {
  // eslint-disable-next-line no-var
  var __safeAgentUnifiedMutationQueue: Promise<unknown> | undefined
}

function nowIso() {
  return new Date().toISOString()
}

function createEmptyState(): PersistedUnifiedState {
  return {
    scans: [],
    logs: {},
  }
}

async function ensureStateRoot() {
  await fs.mkdir(STATE_ROOT, { recursive: true })
}

async function loadState() {
  await ensureStateRoot()
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8')
    return JSON.parse(raw) as PersistedUnifiedState
  } catch {
    return createEmptyState()
  }
}

async function saveState(state: PersistedUnifiedState) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

async function mutateState<T>(mutator: (state: PersistedUnifiedState) => Promise<T> | T): Promise<T> {
  let result: T | undefined

  const nextQueue = (globalThis.__safeAgentUnifiedMutationQueue ?? Promise.resolve())
    .catch(() => undefined)
    .then(async () => {
      const state = await loadState()
      result = await mutator(state)
      await saveState(state)
    })

  globalThis.__safeAgentUnifiedMutationQueue = nextQueue
  await nextQueue

  return result as T
}

function sortByCreatedDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

function hasType(types: string[], target: ScanType) {
  return Array.isArray(types) && types.includes(target)
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function isTerminal(status?: string) {
  return status === 'succeeded' || status === 'failed' || status === 'canceled' || status === 'partial'
}

function mergeProgress(progressList: Array<ScanProgress | undefined>): ScanProgress | undefined {
  const valid = progressList.filter((item): item is ScanProgress => Boolean(item))
  if (valid.length === 0) {
    return undefined
  }

  const percent = Math.round(valid.reduce((sum, item) => sum + item.percent, 0) / valid.length)
  const stageOrder: Array<ScanProgress['stage']> = ['parse', 'precheck', 'run', 'aggregate', 'done']
  const stage = valid.reduce<ScanProgress['stage']>((current, item) => {
    return stageOrder.indexOf(item.stage) > stageOrder.indexOf(current) ? item.stage : current
  }, 'parse')

  const message = valid
    .map((item) => item.message)
    .find((item): item is string => typeof item === 'string' && item.trim().length > 0)

  return { stage, percent, message }
}

function deriveOverallStatus(enabledChecks: ScanCheckState[]): ScanStatus {
  const statuses = enabledChecks.map((item) => item.status)

  if (statuses.every((status) => status === 'succeeded')) {
    return 'succeeded'
  }

  if (statuses.some((status) => status === 'running')) {
    return 'running'
  }

  if (statuses.some((status) => status === 'queued') && !statuses.some((status) => status === 'running')) {
    return 'queued'
  }

  if (statuses.some((status) => status === 'succeeded') && statuses.some((status) => status === 'failed' || status === 'canceled')) {
    return 'partial'
  }

  if (statuses.every((status) => status === 'canceled')) {
    return 'canceled'
  }

  if (statuses.every((status) => status === 'failed')) {
    return 'failed'
  }

  if (statuses.some((status) => status === 'failed')) {
    return 'failed'
  }

  return 'queued'
}

function summarizeRisk(risks: RiskLevel[]): RiskLevel {
  if (risks.includes('high')) return 'high'
  if (risks.includes('medium')) return 'medium'
  if (risks.includes('low')) return 'low'
  return 'unknown'
}

function getCheckLabel(type: ScanType) {
  return type === 'exposure' ? '数据过度暴露检测' : '组合式漏洞检测'
}

function prefixLogs(logs: LogEntry[], prefix: string): LogEntry[] {
  return logs.map((log) => ({
    ...log,
    message: `[${prefix}] ${log.message}`,
  }))
}

async function appendUnifiedLog(scanId: string, level: LogEntry['level'], message: string) {
  return mutateState((state) => {
    state.logs[scanId] = state.logs[scanId] ?? []
    state.logs[scanId].push({
      id: randomUUID(),
      timestamp: nowIso(),
      level,
      message,
    })
  })
}

async function getChildData(type: ScanType, scanId?: string, readers?: ChildReaders): Promise<ChildData> {
  const activeReaders = readers ?? {
    exposure: agentraft,
    fuzzing: mtatlas,
  }

  if (!scanId) {
    return { scan: null, report: null }
  }

  if (type === 'exposure') {
    const scan = await activeReaders.exposure.getScan(scanId)
    const report = scan?.reportId ? await activeReaders.exposure.getReportDetail(scan.reportId) : null
    return { scan, report }
  }

  const scan = await activeReaders.fuzzing.getScan(scanId)
  const report = scan?.reportId ? await activeReaders.fuzzing.getReportDetail(scan.reportId) : null
  return { scan, report }
}

function buildCheckState(type: ScanType, data: ChildData, enabled: boolean): ScanCheckState {
  if (!enabled) {
    return {
      type,
      enabled: false,
      status: 'skipped',
      label: getCheckLabel(type),
    }
  }

  if (!data.scan) {
    return {
      type,
      enabled: true,
      status: 'failed',
      label: getCheckLabel(type),
      error: '子任务不存在。',
    }
  }

  return {
    type,
    enabled: true,
    status: data.scan.status,
    label: getCheckLabel(type),
    scanId: data.scan.id,
    reportId: data.scan.reportId,
    progress: data.scan.progress,
    findingCount: data.report?.summary.totalFindings,
    risk: data.report?.risk,
    updatedAt: data.scan.finishedAt || data.scan.startedAt || data.scan.createdAt,
  }
}

function buildSummary(exposureReport: ReportDetail | null, fuzzingReport: ReportDetail | null): ScanSummary {
  const exposureFindings = exposureReport?.summary.exposureFindings ?? exposureReport?.exposure?.findings.length ?? 0
  const fuzzingFindings = fuzzingReport?.summary.fuzzingFindings ?? fuzzingReport?.fuzzing?.findings.length ?? 0
  const doeToolCount = exposureReport?.summary.doeToolCount ?? exposureFindings
  const chainToolCount = fuzzingReport?.summary.chainToolCount ?? fuzzingFindings
  const highRiskExposureCount = exposureReport?.exposure?.findings.filter((item) => item.severity === 'high').length ?? 0
  const highRiskChainCount = fuzzingReport?.fuzzing?.findings.filter((item) => item.severity === 'high').length ?? 0

  const topRisks = unique(
    [
      ...(exposureReport?.exposure?.findings ?? []).filter((item) => item.severity === 'high').slice(0, 2).map((item) => item.title),
      ...(fuzzingReport?.fuzzing?.findings ?? []).filter((item) => item.severity === 'high').slice(0, 2).map((item) => item.title),
    ].filter(Boolean)
  )

  return {
    totalFindings: exposureFindings + fuzzingFindings,
    exposureFindings,
    fuzzingFindings,
    doeToolCount,
    chainToolCount,
    highRiskExposureCount,
    highRiskChainCount,
    topRisks,
  }
}

function buildIntegratedDetail(exposureReport: ReportDetail | null, fuzzingReport: ReportDetail | null, summary: ScanSummary): IntegratedScanDetail {
  const risk = summarizeRisk([exposureReport?.risk ?? 'unknown', fuzzingReport?.risk ?? 'unknown'])
  const executiveSummary = [
    summary.highRiskExposureCount > 0
      ? `发现 ${summary.highRiskExposureCount} 个高风险 DOE 结果，需要优先审查数据字段暴露链路。`
      : '本次未发现高风险 DOE 结果。',
    summary.highRiskChainCount > 0
      ? `发现 ${summary.highRiskChainCount} 条高风险组合式漏洞链路，建议优先检查高影响 sink。`
      : '本次未发现高风险组合式漏洞链路。',
    summary.totalFindings > 0
      ? `两类检测共识别 ${summary.totalFindings} 条结果，已整合到同一任务详情页。`
      : '当前任务未识别出明确风险结果。',
  ]

  return {
    risk,
    overviewText: unique([...(exposureReport?.overviewText ?? []), ...(fuzzingReport?.overviewText ?? [])]),
    executiveSummary,
    exposure: exposureReport
      ? {
          findings: exposureReport.exposure?.findings ?? [],
          flowGraph: exposureReport.exposure?.flowGraph,
          overviewText: exposureReport.overviewText,
          recommendations: exposureReport.recommendations,
          raw: exposureReport.raw,
        }
      : undefined,
    fuzzing: fuzzingReport
      ? {
          findings: fuzzingReport.fuzzing?.findings ?? [],
          stats: fuzzingReport.fuzzing?.stats,
          overviewText: fuzzingReport.overviewText,
          recommendations: fuzzingReport.recommendations,
          raw: fuzzingReport.raw,
        }
      : undefined,
    recommendations: unique([...(exposureReport?.recommendations ?? []), ...(fuzzingReport?.recommendations ?? [])]),
    raw: {
      exposure: exposureReport?.raw,
      fuzzing: fuzzingReport?.raw,
    },
  }
}

async function buildUnifiedScan(record: UnifiedScanRecord): Promise<Scan> {
  const [exposureData, fuzzingData] = await Promise.all([
    getChildData('exposure', record.childScanIds.exposure),
    getChildData('fuzzing', record.childScanIds.fuzzing),
  ])

  const exposureEnabled = Boolean(record.childScanIds.exposure)
  const fuzzingEnabled = Boolean(record.childScanIds.fuzzing)
  const exposureCheck = buildCheckState('exposure', exposureData, exposureEnabled)
  const fuzzingCheck = buildCheckState('fuzzing', fuzzingData, fuzzingEnabled)
  const enabledChecks = [exposureCheck, fuzzingCheck].filter((item) => item.enabled)
  const summary = buildSummary(exposureData.report, fuzzingData.report)
  const detail = buildIntegratedDetail(exposureData.report, fuzzingData.report, summary)
  const status = deriveOverallStatus(enabledChecks)
  const progress = mergeProgress(enabledChecks.map((item) => item.progress))
  const startedAt = [exposureData.scan?.startedAt, fuzzingData.scan?.startedAt].filter(Boolean).sort()[0]
  const finishedTimes = [exposureData.scan?.finishedAt, fuzzingData.scan?.finishedAt].filter(Boolean).sort()
  const finishedAt = isTerminal(status) ? finishedTimes[finishedTimes.length - 1] : undefined
  const durations = [exposureData.scan?.durationMs, fuzzingData.scan?.durationMs].filter((item): item is number => typeof item === 'number')
  const durationMs = durations.length > 0 ? Math.max(...durations) : undefined

  return {
    id: record.id,
    agentId: record.agentId,
    agentName: record.agentName,
    title: record.title,
    types: record.types,
    status,
    createdAt: record.createdAt,
    startedAt,
    finishedAt,
    durationMs,
    params: record.params,
    progress,
    reportId: summary.totalFindings > 0 || isTerminal(status) ? record.id : undefined,
    checks: {
      exposure: exposureCheck,
      fuzzing: fuzzingCheck,
    },
    summary,
    detail,
  }
}

function toLegacyReport(scan: Scan): Report {
  return {
    id: scan.id,
    agentId: scan.agentId,
    agentName: scan.agentName,
    title: scan.title,
    toolCount: typeof scan.params?.toolCount === 'number' ? scan.params.toolCount : undefined,
    scanId: scan.id,
    createdAt: scan.createdAt,
    types: scan.types,
    risk: scan.detail?.risk ?? 'unknown',
    summary: {
      totalFindings: scan.summary?.totalFindings ?? 0,
      exposureFindings: scan.summary?.exposureFindings,
      fuzzingFindings: scan.summary?.fuzzingFindings,
      doeToolCount: scan.summary?.doeToolCount,
      chainToolCount: scan.summary?.chainToolCount,
    },
  }
}

function toLegacyReportDetail(scan: Scan): ReportDetail {
  const detail = scan.detail
  return {
    ...toLegacyReport(scan),
    overviewText: detail?.overviewText,
    exposure: detail?.exposure
      ? {
          findings: detail.exposure.findings,
          flowGraph: detail.exposure.flowGraph,
        }
      : undefined,
    fuzzing: detail?.fuzzing
      ? {
          findings: detail.fuzzing.findings,
          stats: detail.fuzzing.stats,
        }
      : undefined,
    recommendations: detail?.recommendations,
    raw: detail?.raw,
  }
}

function hydrateLegacyScan(scan: Scan, report: ReportDetail | null): Scan {
  if (!report) {
    return scan
  }

  return {
    ...scan,
    summary: {
      totalFindings: report.summary.totalFindings ?? 0,
      exposureFindings: report.summary.exposureFindings ?? report.exposure?.findings.length ?? 0,
      fuzzingFindings: report.summary.fuzzingFindings ?? report.fuzzing?.findings.length ?? 0,
      doeToolCount: report.summary.doeToolCount ?? report.exposure?.findings.length ?? 0,
      chainToolCount: report.summary.chainToolCount ?? report.fuzzing?.findings.length ?? 0,
      highRiskExposureCount: report.exposure?.findings.filter((item) => item.severity === 'high').length ?? 0,
      highRiskChainCount: report.fuzzing?.findings.filter((item) => item.severity === 'high').length ?? 0,
      topRisks: unique(
        [
          ...(report.exposure?.findings ?? []).filter((item) => item.severity === 'high').slice(0, 2).map((item) => item.title),
          ...(report.fuzzing?.findings ?? []).filter((item) => item.severity === 'high').slice(0, 2).map((item) => item.title),
        ].filter(Boolean)
      ),
    },
    detail: {
      risk: report.risk,
      overviewText: report.overviewText,
      exposure: report.exposure
        ? {
            findings: report.exposure.findings,
            flowGraph: report.exposure.flowGraph,
          }
        : undefined,
      fuzzing: report.fuzzing
        ? {
            findings: report.fuzzing.findings,
            stats: report.fuzzing.stats,
          }
        : undefined,
      recommendations: report.recommendations,
      raw: report.raw,
    },
  }
}

function isReferencedChildScan(id: string, records: UnifiedScanRecord[]) {
  return records.some((record) => Object.values(record.childScanIds).includes(id))
}

async function listUnifiedScans(query?: { agentId?: string }) {
  const state = await loadState()
  const records = query?.agentId ? state.scans.filter((scan) => scan.agentId === query.agentId) : state.scans
  const scans = await Promise.all(records.map((record) => buildUnifiedScan(record)))
  return sortByCreatedDesc(scans)
}

async function listLegacyScans(records: UnifiedScanRecord[], query?: { agentId?: string }): Promise<Scan[]> {
  const [exposureScans, fuzzingScans] = await Promise.all([agentraft.listScans(query), mtatlas.listScans(query)])
  const unreferencedExposureScans = exposureScans.filter((scan) => !isReferencedChildScan(scan.id, records))
  const unreferencedFuzzingScans = fuzzingScans.filter((scan) => !isReferencedChildScan(scan.id, records))

  const [hydratedExposureScans, hydratedFuzzingScans] = await Promise.all([
    Promise.all(
      unreferencedExposureScans.map(async (scan) =>
        hydrateLegacyScan(scan, scan.reportId ? await agentraft.getReportDetail(scan.reportId) : null)
      )
    ),
    Promise.all(
      unreferencedFuzzingScans.map(async (scan) =>
        hydrateLegacyScan(scan, scan.reportId ? await mtatlas.getReportDetail(scan.reportId) : null)
      )
    ),
  ])

  return sortByCreatedDesc([...hydratedExposureScans, ...hydratedFuzzingScans])
}

async function resolveUnifiedRecordByScanId(scanId: string) {
  const state = await loadState()
  return state.scans.find((record) => record.id === scanId) ?? null
}

async function resolveUnifiedRecordByReportId(reportId: string) {
  const state = await loadState()
  return state.scans.find((record) => record.id === reportId) ?? null
}

export async function resolveScanIdByReportId(reportId: string): Promise<string | null> {
  const state = await loadState()
  const direct = state.scans.find((record) => record.id === reportId)
  if (direct) {
    return direct.id
  }

  for (const record of state.scans) {
    if (record.childScanIds.exposure) {
      const child = await agentraft.getScan(record.childScanIds.exposure)
      if (child?.reportId === reportId) {
        return record.id
      }
    }
    if (record.childScanIds.fuzzing) {
      const child = await mtatlas.getScan(record.childScanIds.fuzzing)
      if (child?.reportId === reportId) {
        return record.id
      }
    }
  }

  return null
}

export async function listAgents(): Promise<Agent[]> {
  return [
    {
      id: 'safe-agent-unified',
      name: 'SAFE-Agent 联合检测',
      description: '基于同一份工具 metadata 统一执行数据过度暴露检测和组合式漏洞检测。',
      tags: ['unified', 'exposure', 'fuzzing'],
      inputType: 'spec_upload',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ]
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await listAgents()
  return agents.find((agent) => agent.id === id) ?? null
}

export async function createAgent(payload: Partial<Agent>) {
  return agentraft.createAgent(payload)
}

export async function updateAgentEntry(id: string, payload: Partial<Agent>) {
  return agentraft.updateAgentEntry(id, payload)
}

export async function deleteAgentEntry(id: string) {
  return agentraft.deleteAgentEntry(id)
}

export async function listScans(query?: { agentId?: string }): Promise<Scan[]> {
  const state = await loadState()
  const unified = await listUnifiedScans(query)
  const legacy = await listLegacyScans(state.scans, query)
  return sortByCreatedDesc([...unified, ...legacy])
}

export async function getScan(id: string): Promise<Scan | null> {
  const unified = await resolveUnifiedRecordByScanId(id)
  if (unified) {
    return buildUnifiedScan(unified)
  }

  // 尝试 SkillPecker（技能可信安全检测）
  try {
    const spRes = await fetch(`${process.env.SKILLPECKER_API_BASE ?? 'http://127.0.0.1:8010/api'}/scans/${id}`, {
      cache: 'no-store',
    })
    if (spRes.ok) {
      const wrapper: Record<string, unknown> = await spRes.json()
      const job: Record<string, unknown> = (wrapper.job as Record<string, unknown>) ?? wrapper
      const excerpt: Record<string, unknown> = (job.summaryExcerpt as Record<string, unknown>) ?? {}
      const labelCounts: Record<string, number> = (excerpt.labelCounts as Record<string, number>) ?? {}
      const skillNames = Array.isArray(job.skillNames) ? job.skillNames : []
      const malicious = (labelCounts.malicious ?? 0) + (labelCounts.unsafe ?? 0) + (labelCounts.mixed_risk ?? 0)
      const suspicious = (labelCounts.insufficient_evidence ?? 0)
      const safe = (excerpt.scannedCount as number ?? 0) - malicious - suspicious
      return {
        id: job.id as string,
        agentId: '',
        agentName: undefined,
        title: skillNames.length > 0 ? skillNames.join('、') : undefined,
        types: ['exposure'],
        status: (job.status as string) === 'completed' ? 'succeeded' : ((job.status as Scan['status']) ?? 'succeeded'),
        createdAt: job.createdAt as string,
        startedAt: job.startedAt as string | undefined,
        finishedAt: job.finishedAt as string | undefined,
        durationMs: job.durationMs as number | undefined,
        params: {
          taskName: skillNames.length > 0 ? `技能扫描：${skillNames.join('、')}` : undefined,
          selectedChecks: ['exposure'],
        },
        summary: {
          totalFindings: (excerpt.scannedCount as number) ?? 0,
          exposureFindings: 0,
          fuzzingFindings: 0,
          doeToolCount: (excerpt.scannedCount as number) ?? 0,
          chainToolCount: 0,
          highRiskExposureCount: malicious,
          highRiskChainCount: 0,
          topRisks: [],
        },
      }
    }
  } catch {
    // ignore, fall through
  }

  const exposureScan = await agentraft.getScan(id)
  if (exposureScan) {
    return hydrateLegacyScan(exposureScan, exposureScan.reportId ? await agentraft.getReportDetail(exposureScan.reportId) : null)
  }

  const fuzzingScan = await mtatlas.getScan(id)
  if (!fuzzingScan) {
    return null
  }

  return hydrateLegacyScan(fuzzingScan, fuzzingScan.reportId ? await mtatlas.getReportDetail(fuzzingScan.reportId) : null)
}

export async function createScan(payload: CreateScanPayload): Promise<Scan> {
  const params = payload.params ?? {}
  const taskName =
    payload.title ||
    (typeof params.taskName === 'string' && params.taskName.trim() ? params.taskName.trim() : '') ||
    `联合检测 ${new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`

  const wantsExposure = hasType(payload.types, 'exposure')
  const wantsFuzzing = hasType(payload.types, 'fuzzing')

  if (!wantsExposure && !wantsFuzzing) {
    throw new Error('至少需要启用一种检测。')
  }

  const metadataText = typeof params.metadataText === 'string' ? params.metadataText : ''
  if (!metadataText.trim()) {
    throw new Error('请提供工具 metadata JSON。')
  }

  const sourceFunctions = Array.isArray(params.sourceFunctions) ? params.sourceFunctions : []
  const sinkFunctions = Array.isArray(params.sinkFunctions) ? params.sinkFunctions : []
  const exposureEnabled = wantsExposure && sourceFunctions.length > 0 && sinkFunctions.length > 0
  const fuzzingEnabled = wantsFuzzing

  if (!exposureEnabled && !fuzzingEnabled) {
    throw new Error('请至少启用一种有效检测。DOE 检测需要同时填写 source 和 sink。')
  }

  const [exposureChild, fuzzingChild] = await Promise.all([
    exposureEnabled
      ? agentraft.createScan({
          agentId: AGENTRAFT_DEFAULT_AGENT_ID,
          types: ['exposure'],
          params: {
            ...params,
            taskName,
            selectedChecks: ['exposure'],
          },
        })
      : Promise.resolve(null),
    fuzzingEnabled
      ? mtatlas.createScan({
          agentId: MTATLAS_DEFAULT_AGENT_ID,
          types: ['fuzzing'],
          params: {
            ...params,
            taskName,
            selectedChecks: ['fuzzing'],
          },
        })
      : Promise.resolve(null),
  ])

  const record = await mutateState((state) => {
    const timestamp = nowIso()
    const entry: UnifiedScanRecord = {
      id: randomUUID(),
      agentId: 'safe-agent-unified',
      agentName: 'SAFE-Agent 联合检测',
      title: taskName,
      createdAt: timestamp,
      types: unique([
        ...(exposureEnabled ? (['exposure'] as ScanType[]) : []),
        ...(fuzzingEnabled ? (['fuzzing'] as ScanType[]) : []),
      ]),
      params: {
        ...params,
        taskName,
        selectedChecks: unique([
          ...(exposureEnabled ? ['exposure'] : []),
          ...(fuzzingEnabled ? ['fuzzing'] : []),
        ]),
        toolCount:
          typeof params.toolCount === 'number'
            ? params.toolCount
            : exposureChild?.params?.toolCount ?? fuzzingChild?.params?.toolCount ?? 0,
      },
      childScanIds: {
        exposure: exposureChild?.id,
        fuzzing: fuzzingChild?.id,
      },
    }

    state.scans.unshift(entry)
    state.logs[entry.id] = [
      {
        id: randomUUID(),
        timestamp,
        level: 'info',
        message: `已创建联合检测任务。${exposureEnabled ? ' DOE 检测已启用。' : ' DOE 检测未启用。'}${fuzzingEnabled ? ' 组合式漏洞检测已启用。' : ''}`,
      },
    ]

    return entry
  })

  return buildUnifiedScan(record)
}

export async function cancelScanEntry(id: string): Promise<Scan> {
  const unified = await resolveUnifiedRecordByScanId(id)
  if (unified) {
    if (unified.childScanIds.exposure) {
      const child = await agentraft.getScan(unified.childScanIds.exposure)
      if (child && !isTerminal(child.status)) {
        await agentraft.cancelScanEntry(child.id)
      }
    }

    if (unified.childScanIds.fuzzing) {
      const child = await mtatlas.getScan(unified.childScanIds.fuzzing)
      if (child && !isTerminal(child.status)) {
        await mtatlas.cancelScanEntry(child.id)
      }
    }

    await appendUnifiedLog(id, 'warn', '已请求取消当前联合检测任务。')
    return buildUnifiedScan(unified)
  }

  const scan = await agentraft.getScan(id)
  if (scan) {
    return agentraft.cancelScanEntry(id)
  }

  return mtatlas.cancelScanEntry(id)
}

export async function getScanLogs(id: string): Promise<LogEntry[]> {
  const unified = await resolveUnifiedRecordByScanId(id)
  if (unified) {
    const state = await loadState()
    const [exposureLogs, fuzzingLogs] = await Promise.all([
      unified.childScanIds.exposure ? agentraft.getScanLogs(unified.childScanIds.exposure) : Promise.resolve([]),
      unified.childScanIds.fuzzing ? mtatlas.getScanLogs(unified.childScanIds.fuzzing) : Promise.resolve([]),
    ])

    return [...(state.logs[id] ?? []), ...prefixLogs(exposureLogs, 'DOE'), ...prefixLogs(fuzzingLogs, '组合')].sort(
      (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    )
  }

  const exposureLogs = await agentraft.getScanLogs(id)
  if (exposureLogs.length > 0) {
    return exposureLogs
  }
  return mtatlas.getScanLogs(id)
}

export async function listReports(query?: { agentId?: string; risk?: string; type?: string }): Promise<Report[]> {
  const scans = await listUnifiedScans(query)
  let reports = scans.filter((scan) => isTerminal(scan.status)).map((scan) => toLegacyReport(scan))

  if (query?.risk) {
    reports = reports.filter((report) => report.risk === query.risk)
  }
  if (query?.type) {
    reports = reports.filter((report) => report.types.includes(query.type as ScanType))
  }

  return sortByCreatedDesc(reports)
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  const scanId = await resolveScanIdByReportId(id)
  if (scanId) {
    const scan = await getScan(scanId)
    if (scan?.detail) {
      return toLegacyReportDetail(scan)
    }
  }

  const exposure = await agentraft.getReportDetail(id)
  if (exposure) {
    return exposure
  }

  return mtatlas.getReportDetail(id)
}

function buildSimplePdf(lines: string[]) {
  const body = lines
    .slice(0, 28)
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 11} Tf 48 ${760 - index * 18} Td (${line.replace(/[()\\]/g, '\\$&')}) Tj ET`)
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

export async function downloadReportFile(id: string, format: 'pdf' | 'json' = 'json') {
  const report = await getReportDetail(id)
  if (!report) {
    throw new Error('报告不存在。')
  }

  if (format === 'json') {
    return {
      filename: `${report.scanId}.json`,
      contentType: 'application/json; charset=utf-8',
      data: Buffer.from(JSON.stringify(report, null, 2), 'utf-8'),
    }
  }

  const lines = [
    `SAFE-Agent 联合检测报告 ${report.scanId}`,
    `任务: ${report.title ?? report.agentName ?? report.scanId}`,
    `创建时间: ${report.createdAt}`,
    `风险等级: ${report.risk}`,
    `结果总数: ${report.summary.totalFindings}`,
    ...((report.overviewText ?? []).slice(0, 10)),
    ...((report.recommendations ?? []).slice(0, 5).map((item) => `建议: ${item}`)),
  ]

  return {
    filename: `${report.scanId}.pdf`,
    contentType: 'application/pdf',
    data: buildSimplePdf(lines),
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [agents, scans, reports] = await Promise.all([listAgents(), listScans(), listReports()])
  return {
    agentCount: agents.length,
    recentScanCount: scans.length,
    failedScanCount: scans.filter((scan) => scan.status === 'failed').length,
    highRiskReportCount: reports.filter((report) => report.risk === 'high').length,
  }
}

export async function testConnection(url: string) {
  return agentraft.testConnection(url)
}

export const __internal = {
  getChildData,
}
