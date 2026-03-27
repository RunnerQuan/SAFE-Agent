export type AgentInputType = 'spec_upload' | 'endpoint'

export interface Agent {
  id: string
  name: string
  version?: string
  description?: string
  tags?: string[]
  inputType: AgentInputType
  createdAt: string
  updatedAt: string
  endpointUrl?: string
  authType?: 'none' | 'api_key' | 'bearer'
  specFilename?: string
  toolCount?: number
  highRiskToolCount?: number
  lastScanAt?: string
}

export type ScanType = 'exposure' | 'fuzzing'
export type ScanStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export interface ScanProgress {
  stage: 'parse' | 'precheck' | 'run' | 'aggregate' | 'done'
  percent: number
  message?: string
}

export interface ToolMetadataItem {
  name: string
  signature?: string
  description?: string
  mcp?: string
  code?: string
}

export interface Scan {
  id: string
  agentId: string
  agentName?: string
  title?: string
  types: ScanType[]
  status: ScanStatus
  createdAt: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  params?: Record<string, unknown>
  progress?: ScanProgress
  reportId?: string
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface ReportSummary {
  totalFindings: number
  exposureFindings?: number
  fuzzingFindings?: number
  doeToolCount?: number
  chainToolCount?: number
}

export interface Report {
  id: string
  agentId: string
  agentName?: string
  title?: string
  toolCount?: number
  scanId: string
  createdAt: string
  types: ScanType[]
  risk: RiskLevel
  summary: ReportSummary
}

export interface FindingBase {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  toolName?: string
  toolSignature?: string
  detectionInfo?: string
  evidence?: string
}

export interface ExposureFinding extends FindingBase {
  dataType: string
  source?: string
  sinks?: string[]
  flowPath?: string[]
}

export interface FuzzingFinding extends FindingBase {
  attackType: string
  payloadSummary?: string
  reproductionSteps?: string
  trace?: string[]
}

export interface ReportDetail extends Report {
  overviewText?: string[]
  exposure?: {
    findings: ExposureFinding[]
    flowGraph?: unknown
  }
  fuzzing?: {
    findings: FuzzingFinding[]
    stats?: Record<string, number>
  }
  recommendations?: string[]
  raw?: unknown
}

export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface DashboardStats {
  agentCount: number
  recentScanCount: number
  failedScanCount: number
  highRiskReportCount: number
}
