export type SkillPeckerJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'unknown'
export type SkillPeckerDecisionLevel = 'MALICIOUS' | 'SUSPICIOUS' | 'OVERREACH' | 'SAFE'

export interface SkillPeckerHealth {
  status: string
  scanMode: string
  scanResultsRoot: string
  maliciousLibraryRoot: string
}

export interface SkillPeckerQueueCounts {
  running: number
  queued: number
  completed: number
  failed: number
}

export interface SkillPeckerSummaryExcerpt {
  skillCount: number
  scannedCount: number
  failedCount: number
  labelCounts: Record<string, number>
}

export interface SkillPeckerJobSummary {
  id: string
  status: SkillPeckerJobStatus
  createdAt?: string
  startedAt?: string
  finishedAt?: string
  scanMode?: string
  skillNames: string[]
  skillCount: number
  error?: string | null
  queuePosition?: number | null
  summaryExcerpt?: SkillPeckerSummaryExcerpt | null
  logFile?: string | null
}

export interface SkillPeckerQueueResponse {
  jobs: SkillPeckerJobSummary[]
  queue: SkillPeckerQueueCounts
}

export interface SkillPeckerJobSkillSummary {
  name: string
  status: SkillPeckerJobStatus
  artifactCount: number
  ruleHitCount: number
  verdictLabel?: string
  primaryConcern?: string
  decisionLevel?: SkillPeckerDecisionLevel
  findingCount: number
  errorMessage?: string
}

export interface SkillPeckerJobDetail {
  job: SkillPeckerJobSummary
  summary?: Record<string, unknown>
  skills: SkillPeckerJobSkillSummary[]
  scannedCount: number
  failedCount: number
}

export interface SkillPeckerFindingSpan {
  path?: string
  start?: number
  end?: number
  why?: string
}

export interface SkillPeckerFinding {
  id?: string
  summary: string
  decisionLevel?: SkillPeckerDecisionLevel
  category?: string
  findingClass?: string
  primaryGroup?: string
  sourcePlatform?: string
  sourceFile?: string
  scanLevel?: string
  relatedFileCount?: string
  impact?: string
  fix?: string
  confidence?: string
  severity?: string
  riskTypes: string[]
  flags: Record<string, boolean>
  spans: SkillPeckerFindingSpan[]
}

export interface SkillPeckerCoverageGap {
  path?: string
  why?: string
}

export interface SkillPeckerSkillResult {
  jobId: string
  skillName: string
  status: 'ok' | 'error'
  verdictLabel?: string
  primaryConcern?: string
  findings: SkillPeckerFinding[]
  scorecard?: {
    maliciousness?: number
    safety?: number
    descriptionReliability?: number
    coverage?: number
  }
  coverageAudit?: {
    adequate?: boolean
    needsRescan?: boolean
    missed: SkillPeckerCoverageGap[]
  }
  rawResult?: unknown
  rawError?: unknown
  errorMessage?: string
}

export interface SkillPeckerLibraryItem {
  id: string
  name: string
  businessCategory: string
  slug: string
  version: string
  ownerId: string
  publishedAt?: string | null
  url: string
  description: string
  skillPath: string
  resultAvailable: boolean
  verdict?: {
    label?: string
    primary_concern?: string
    issue_types?: string[]
  } | null
  categories: string[]
  findingCount: number
  decisionLevels: SkillPeckerDecisionLevel[]
  primaryDecisionLevel?: SkillPeckerDecisionLevel
  hasSkillDoc: boolean
}

export interface SkillPeckerLibraryResponse {
  root: string
  count: number
  page: number
  pageSize: number
  totalPages: number
  query: string
  decisionLevels: SkillPeckerDecisionLevel[]
  items: SkillPeckerLibraryItem[]
}

export interface SkillPeckerLibraryDetail {
  item: SkillPeckerLibraryItem & {
    docPreview: string
  }
  scanResult?: unknown
  judge?: {
    verdict?: {
      label?: string
      primary_concern?: string
      issue_types?: string[]
    }
    top_findings?: Array<Record<string, unknown>>
  } | null
}

export interface SkillPeckerChartDatum {
  label: string
  value: number
  color: string
}

export interface SkillPeckerOverview {
  health?: SkillPeckerHealth
  queue: SkillPeckerQueueCounts
  libraryCount: number
  riskBreakdown: SkillPeckerChartDatum[]
  primaryRiskGroups: SkillPeckerChartDatum[]
  businessCategoryTop: SkillPeckerChartDatum[]
  metrics: Array<{
    label: string
    value: string
    accent: 'scan' | 'issue' | 'overreach'
  }>
}

export interface SkillPeckerLibraryQuery {
  page?: number
  pageSize?: number
  query?: string
  decisionLevels?: SkillPeckerDecisionLevel[]
}
