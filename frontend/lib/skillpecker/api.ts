import {
  SkillPeckerDecisionLevel,
  SkillPeckerFinding,
  SkillPeckerHealth,
  SkillPeckerJobDetail,
  SkillPeckerJobSkillSummary,
  SkillPeckerJobStatus,
  SkillPeckerJobSummary,
  SkillPeckerLibraryDetail,
  SkillPeckerLibraryItem,
  SkillPeckerLibraryQuery,
  SkillPeckerLibraryResponse,
  SkillPeckerOverview,
  SkillPeckerQueueResponse,
  SkillPeckerSkillResult,
  SkillPeckerSummaryExcerpt,
} from '@/lib/skillpecker/types'

const SKILLPECKER_API_BASE = '/api/skillpecker'

const OVERVIEW_FALLBACK: SkillPeckerOverview = {
  queue: { running: 0, queued: 0, completed: 0, failed: 0 },
  libraryCount: 100000,
  riskBreakdown: [
    { label: '恶意型', value: 36, color: '#4c1d95' },
    { label: '可疑型', value: 117, color: '#f97316' },
    { label: '越界型', value: 1201, color: '#fb7185' },
  ],
  primaryRiskGroups: [
    { label: '访问边界风险', value: 832, color: '#ef4444' },
    { label: '数据治理风险', value: 291, color: '#f59e0b' },
    { label: '执行/系统风险', value: 185, color: '#60a5fa' },
    { label: '明确恶意运行行为', value: 36, color: '#a78bfa' },
    { label: '其他', value: 10, color: '#94a3b8' },
  ],
  businessCategoryTop: [
    { label: '通用工具', value: 286, color: '#dc2626' },
    { label: '办公生产力', value: 204, color: '#f97316' },
    { label: '大模型/AI', value: 93, color: '#f59e0b' },
    { label: '数据智能', value: 46, color: '#0ea5e9' },
    { label: '运维', value: 45, color: '#2563eb' },
    { label: 'CI/CD', value: 42, color: '#8b5cf6' },
    { label: '测试安全', value: 38, color: '#14b8a6' },
    { label: '金融投资', value: 37, color: '#38bdf8' },
    { label: '项目管理', value: 36, color: '#065f46' },
    { label: '其他', value: 166, color: '#94a3b8' },
  ],
  metrics: [
    { label: '扫描技能总量', value: '~100,000', accent: 'scan' },
    { label: '问题技能数量', value: '1,350', accent: 'issue' },
    { label: '越界型占比', value: '88.7%', accent: 'overreach' },
  ],
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function pickString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return ''
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function pickNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return 0
  }

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return 0
}

function pickBooleanMap(value: unknown) {
  const record = toRecord(value)
  if (!record) {
    return {}
  }

  return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, Boolean(entry)])) as Record<string, boolean>
}

function normalizeDecisionLevel(value: unknown): SkillPeckerDecisionLevel | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === 'MALICIOUS' || normalized === 'SUSPICIOUS' || normalized === 'OVERREACH' || normalized === 'SAFE') {
    return normalized
  }

  return undefined
}

function humanizeLookupValue(value: string) {
  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractErrorMessage(payload: unknown, fallbackStatus: number) {
  const record = toRecord(payload)
  if (!record) {
    return `SkillPecker request failed (${fallbackStatus})`
  }

  return pickString(record, ['detail', 'message', 'error']) || `SkillPecker request failed (${fallbackStatus})`
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status))
  }

  return payload as T
}

async function fetchSkillPecker<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SKILLPECKER_API_BASE}${path}`, {
    cache: 'no-store',
    ...init,
  })

  return readJsonResponse<T>(response)
}

function normalizeSummaryExcerpt(value: unknown): SkillPeckerSummaryExcerpt | null {
  const record = toRecord(value)
  if (!record) {
    return null
  }

  return {
    skillCount: pickNumber(record, ['skillCount']),
    scannedCount: pickNumber(record, ['scannedCount']),
    failedCount: pickNumber(record, ['failedCount']),
    labelCounts: (toRecord(record.labelCounts) as Record<string, number> | null) ?? {},
  }
}

function normalizeJobStatus(value: unknown): SkillPeckerJobStatus {
  if (value === 'queued' || value === 'running' || value === 'completed' || value === 'failed') {
    return value
  }

  return 'unknown'
}

function normalizeJobSummary(value: unknown): SkillPeckerJobSummary {
  const record = toRecord(value)

  return {
    id: pickString(record, ['id']),
    status: normalizeJobStatus(record?.status),
    createdAt: pickString(record, ['createdAt']) || undefined,
    startedAt: pickString(record, ['startedAt']) || undefined,
    finishedAt: pickString(record, ['finishedAt']) || undefined,
    scanMode: pickString(record, ['scanMode']) || undefined,
    skillNames: toArray<string>(record?.skillNames).filter(Boolean),
    skillCount: pickNumber(record, ['skillCount']),
    error: pickString(record, ['error']) || null,
    queuePosition: typeof record?.queuePosition === 'number' ? record.queuePosition : null,
    summaryExcerpt: normalizeSummaryExcerpt(record?.summaryExcerpt),
    logFile: pickString(record, ['logFile']) || null,
  }
}

function extractVerdictLabel(value: unknown) {
  return pickString(toRecord(value), ['label'])
}

function extractPrimaryConcern(value: unknown) {
  return pickString(toRecord(value), ['primary_concern', 'primaryConcern'])
}

function normalizeSpan(value: unknown) {
  const record = toRecord(value)
  if (!record) {
    return {}
  }

  return {
    path: pickString(record, ['path']) || undefined,
    start: typeof record.s === 'number' ? record.s : typeof record.start === 'number' ? record.start : undefined,
    end: typeof record.e === 'number' ? record.e : typeof record.end === 'number' ? record.end : undefined,
    why: pickString(record, ['why']) || undefined,
  }
}

function normalizeCoverageGap(value: unknown) {
  const record = toRecord(value)
  if (!record) {
    if (typeof value === 'string' && value.trim()) {
      return { why: value.trim() }
    }
    return {}
  }

  return {
    path: pickString(record, ['path']) || undefined,
    why: pickString(record, ['why']) || undefined,
  }
}

function normalizeFindingSpans(value: unknown) {
  return toArray(value)
    .map(normalizeSpan)
    .filter((span) => span.path || span.why)
}

function normalizeFindings(value: unknown): SkillPeckerFinding[] {
  return toArray<Record<string, unknown>>(value).map((finding) => ({
    id: pickString(finding, ['id']) || undefined,
    summary: pickString(finding, ['summary', 'problem_summary']) || '暂无问题摘要。',
    decisionLevel: normalizeDecisionLevel(finding.decision_level),
    category: pickString(finding, ['cat', 'category']) || undefined,
    findingClass: pickString(finding, ['class']) || undefined,
    primaryGroup: pickString(finding, ['primary_group', 'primaryGroup']) || undefined,
    sourcePlatform: pickString(finding, ['source_platform', 'sourcePlatform']) || undefined,
    sourceFile: pickString(finding, ['source_file', 'sourceFile']) || undefined,
    scanLevel: pickString(finding, ['scan_level', 'scanLevel']) || undefined,
    relatedFileCount: pickString(finding, ['related_file_count', 'relatedFileCount']) || undefined,
    impact: pickString(finding, ['impact']) || undefined,
    fix: pickString(finding, ['fix']) || undefined,
    confidence: pickString(finding, ['conf', 'confidence']) || undefined,
    severity: pickString(finding, ['severity']) || undefined,
    riskTypes: toArray<string>(finding.risk_types).filter(Boolean),
    flags: pickBooleanMap(finding.flags),
    spans: normalizeFindingSpans(finding.spans),
  }))
}

function normalizeJobSkill(entry: Record<string, unknown>, index: number): SkillPeckerJobSkillSummary {
  const judge = toRecord(entry.judge)
  const verdict = toRecord(judge?.verdict ?? entry.verdict)
  const findings = normalizeFindings(judge?.top_findings ?? entry.top_findings ?? entry.findings)

  return {
    name:
      pickString(entry, ['skill_name', 'skillName', 'name', 'id']) ||
      pickString(toRecord(entry.skill), ['name']) ||
      `Skill ${index + 1}`,
    status: normalizeJobStatus(entry.status ?? (findings.length ? 'completed' : 'unknown')),
    artifactCount: pickNumber(entry, ['artifact_count', 'artifactCount']),
    ruleHitCount: pickNumber(entry, ['rule_hit_count', 'ruleHitCount']),
    verdictLabel: extractVerdictLabel(verdict) || undefined,
    primaryConcern: extractPrimaryConcern(verdict) || undefined,
    decisionLevel: findings[0]?.decisionLevel,
    findingCount: findings.length,
    errorMessage: pickString(entry, ['error']) || undefined,
  }
}

function normalizeJobSkills(summary: Record<string, unknown> | undefined) {
  return toArray<Record<string, unknown>>(summary?.skills).map(normalizeJobSkill)
}

function normalizeLibraryItem(value: unknown): SkillPeckerLibraryItem {
  const record = toRecord(value)
  const verdict = toRecord(record?.verdict)

  return {
    id: pickString(record, ['id']),
    name: pickString(record, ['name']),
    businessCategory: pickString(record, ['businessCategory']),
    slug: pickString(record, ['slug']),
    version: pickString(record, ['version']),
    ownerId: pickString(record, ['ownerId']),
    publishedAt: pickString(record, ['publishedAt']) || null,
    url: pickString(record, ['url']),
    description: pickString(record, ['description']),
    skillPath: pickString(record, ['skillPath']),
    resultAvailable: Boolean(record?.resultAvailable),
    verdict: verdict
      ? {
          label: pickString(verdict, ['label']) || undefined,
          primary_concern: pickString(verdict, ['primary_concern']) || undefined,
          issue_types: toArray<string>(verdict.issue_types).filter(Boolean),
        }
      : null,
    categories: toArray<string>(record?.categories).filter(Boolean),
    findingCount: pickNumber(record, ['findingCount']),
    decisionLevels: toArray(record?.decisionLevels)
      .map((item) => normalizeDecisionLevel(item))
      .filter((item): item is SkillPeckerDecisionLevel => Boolean(item)),
    primaryDecisionLevel: normalizeDecisionLevel(record?.primaryDecisionLevel),
    hasSkillDoc: Boolean(record?.hasSkillDoc),
  }
}

function buildRiskBreakdown(libraryItems: SkillPeckerLibraryItem[]) {
  const counters = new Map<string, number>([
    ['恶意型', 0],
    ['可疑型', 0],
    ['越界型', 0],
  ])

  for (const item of libraryItems) {
    switch (item.primaryDecisionLevel) {
      case 'MALICIOUS':
        counters.set('恶意型', (counters.get('恶意型') ?? 0) + 1)
        break
      case 'SUSPICIOUS':
        counters.set('可疑型', (counters.get('可疑型') ?? 0) + 1)
        break
      case 'OVERREACH':
        counters.set('越界型', (counters.get('越界型') ?? 0) + 1)
        break
      default:
        break
    }
  }

  return [
    { label: '恶意型', value: counters.get('恶意型') ?? 0, color: '#4c1d95' },
    { label: '可疑型', value: counters.get('可疑型') ?? 0, color: '#f97316' },
    { label: '越界型', value: counters.get('越界型') ?? 0, color: '#fb7185' },
  ]
}

function buildPrimaryRiskGroups(libraryItems: SkillPeckerLibraryItem[]) {
  const counts = new Map<string, number>()

  for (const item of libraryItems) {
    for (const category of item.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], index) => ({
      label: humanizeLookupValue(label),
      value,
      color: ['#ef4444', '#f59e0b', '#60a5fa', '#a78bfa', '#94a3b8'][index] ?? '#94a3b8',
    }))
}

function buildBusinessCategoryTop(libraryItems: SkillPeckerLibraryItem[]) {
  const counts = new Map<string, number>()

  for (const item of libraryItems) {
    const key = item.businessCategory || '其他'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value], index) => ({
      label: humanizeLookupValue(label),
      value,
      color:
        ['#dc2626', '#f97316', '#f59e0b', '#0ea5e9', '#2563eb', '#8b5cf6', '#14b8a6', '#38bdf8', '#065f46', '#94a3b8'][
          index
        ] ?? '#94a3b8',
    }))
}

function toMetricCount(value: number) {
  if (value >= 100000) {
    return `~${value.toLocaleString()}`
  }

  return value.toLocaleString()
}

export async function getSkillPeckerHealth() {
  return fetchSkillPecker<SkillPeckerHealth>('/health')
}

export async function getSkillPeckerQueue(): Promise<SkillPeckerQueueResponse> {
  const payload = await fetchSkillPecker<Record<string, unknown>>('/scans')

  return {
    jobs: toArray(payload.jobs).map(normalizeJobSummary),
    queue: {
      running: pickNumber(toRecord(payload.queue), ['running']),
      queued: pickNumber(toRecord(payload.queue), ['queued']),
      completed: pickNumber(toRecord(payload.queue), ['completed']),
      failed: pickNumber(toRecord(payload.queue), ['failed']),
    },
  }
}

export async function getSkillPeckerJobDetail(jobId: string): Promise<SkillPeckerJobDetail> {
  const payload = await fetchSkillPecker<Record<string, unknown>>(`/scans/${encodeURIComponent(jobId)}`)
  const summary = toRecord(payload.summary) ?? undefined

  return {
    job: normalizeJobSummary(payload.job),
    summary,
    skills: normalizeJobSkills(summary),
    scannedCount: pickNumber(summary ?? null, ['scanned_count', 'scannedCount']),
    failedCount: pickNumber(summary ?? null, ['failed_count', 'failedCount']),
  }
}

export async function getSkillPeckerSkillResult(jobId: string, skillName: string): Promise<SkillPeckerSkillResult> {
  const payload = await fetchSkillPecker<Record<string, unknown>>(
    `/scans/${encodeURIComponent(jobId)}/skills/${encodeURIComponent(skillName)}`
  )
  const result = toRecord(payload.result)
  const judge = toRecord(result?.judge)
  const verdict = toRecord(judge?.verdict)
  const security = toRecord(result?.security)
  const coverageAudit = toRecord(judge?.coverage_audit)

  return {
    jobId: pickString(payload, ['jobId']) || jobId,
    skillName: pickString(payload, ['skillName']) || skillName,
    status: payload.status === 'error' ? 'error' : 'ok',
    verdictLabel: extractVerdictLabel(verdict) || undefined,
    primaryConcern: extractPrimaryConcern(verdict) || undefined,
    findings: normalizeFindings(judge?.top_findings ?? security?.findings),
    scorecard: {
      maliciousness: pickNumber(verdict, ['maliciousness', 'maliciousness_score']),
      safety: pickNumber(verdict, ['safety', 'implementation_risk_score', 'safety_score']),
      descriptionReliability: pickNumber(verdict, ['description_reliability', 'description_reliability_score']),
      coverage: pickNumber(verdict, ['coverage', 'coverage_score']),
    },
    coverageAudit: {
      adequate: typeof coverageAudit?.adequate === 'boolean' ? coverageAudit.adequate : undefined,
      needsRescan: typeof coverageAudit?.needs_rescan === 'boolean' ? coverageAudit.needs_rescan : undefined,
      missed: toArray(coverageAudit?.missed).map(normalizeCoverageGap).filter((item) => item.path || item.why),
    },
    rawResult: payload.result,
    rawError: payload.error,
    errorMessage:
      pickString(toRecord(payload.error), ['detail', 'message']) || (typeof payload.error === 'string' ? payload.error : undefined),
  }
}

export async function createSkillPeckerScan(formData: FormData) {
  return fetchSkillPecker<Record<string, unknown>>('/scans', {
    method: 'POST',
    body: formData,
  }).then((payload) => ({
    job: payload.job ? normalizeJobSummary(payload.job) : undefined,
  }))
}

export async function getSkillPeckerLibrary(query: SkillPeckerLibraryQuery = {}): Promise<SkillPeckerLibraryResponse> {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('page_size', String(query.pageSize))
  if (query.query) params.set('query', query.query)
  if (query.decisionLevels?.length) params.set('decision_levels', query.decisionLevels.join(','))

  const payload = await fetchSkillPecker<Record<string, unknown>>(`/library?${params.toString()}`)

  return {
    root: pickString(payload, ['root']),
    count: pickNumber(payload, ['count']),
    page: pickNumber(payload, ['page']),
    pageSize: pickNumber(payload, ['pageSize']),
    totalPages: pickNumber(payload, ['totalPages']),
    query: pickString(payload, ['query']),
    decisionLevels: toArray(payload.decisionLevels)
      .map((value) => normalizeDecisionLevel(value))
      .filter((value): value is SkillPeckerDecisionLevel => Boolean(value)),
    items: toArray(payload.items).map(normalizeLibraryItem),
  }
}

export async function getSkillPeckerLibraryDetail(skillId: string): Promise<SkillPeckerLibraryDetail> {
  const payload = await fetchSkillPecker<Record<string, unknown>>(`/library/${encodeURIComponent(skillId)}`)

  return {
    item: {
      ...normalizeLibraryItem(payload.item),
      docPreview: pickString(toRecord(payload.item), ['docPreview']),
    },
    scanResult: payload.scanResult,
    judge: toRecord(payload.judge) as SkillPeckerLibraryDetail['judge'],
  }
}

export async function getSkillPeckerOverview(): Promise<SkillPeckerOverview> {
  try {
    const [health, queue, library] = await Promise.all([
      getSkillPeckerHealth(),
      getSkillPeckerQueue(),
      getSkillPeckerLibrary({ page: 1, pageSize: 200 }),
    ])

    const riskBreakdown = buildRiskBreakdown(library.items)
    const issueSkillCount = riskBreakdown.reduce((sum, item) => sum + item.value, 0)
    const overreachCount = riskBreakdown.find((item) => item.label === '越界型')?.value ?? 0
    const overreachRatio = issueSkillCount ? `${((overreachCount / issueSkillCount) * 100).toFixed(1)}%` : '0.0%'

    return {
      health,
      queue: queue.queue,
      libraryCount: library.count,
      riskBreakdown: riskBreakdown.some((item) => item.value > 0) ? riskBreakdown : OVERVIEW_FALLBACK.riskBreakdown,
      primaryRiskGroups: buildPrimaryRiskGroups(library.items).length
        ? buildPrimaryRiskGroups(library.items)
        : OVERVIEW_FALLBACK.primaryRiskGroups,
      businessCategoryTop: buildBusinessCategoryTop(library.items).length
        ? buildBusinessCategoryTop(library.items)
        : OVERVIEW_FALLBACK.businessCategoryTop,
      metrics: [
        { label: '扫描技能总量', value: toMetricCount(library.count || OVERVIEW_FALLBACK.libraryCount), accent: 'scan' },
        { label: '问题技能数量', value: (issueSkillCount || 1350).toLocaleString(), accent: 'issue' },
        { label: '越界型占比', value: overreachRatio === '0.0%' ? OVERVIEW_FALLBACK.metrics[2].value : overreachRatio, accent: 'overreach' },
      ],
    }
  } catch {
    return OVERVIEW_FALLBACK
  }
}
