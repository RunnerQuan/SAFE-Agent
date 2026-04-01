import {
  Agent,
  DashboardStats,
  DoeLibraryCase,
  ExposureFinding,
  FuzzingFinding,
  LogEntry,
  Report,
  ReportDetail,
  Scan,
  ScanProgress,
  ToolMetadataItem,
} from './types'
import { generateMockLogs, mockDashboardStats, mockState } from './mockData'
import { generateId, sleep } from './utils'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'
const DEFAULT_AGENT_ID = 'tool-batch'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

function parseMetadataTools(raw: unknown): ToolMetadataItem[] {
  if (typeof raw !== 'string' || !raw.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.metadata)
        ? parsed.metadata
        : Array.isArray(parsed?.functions)
          ? parsed.functions
          : Array.isArray(parsed?.items)
            ? parsed.items
            : []

    return list.map((item: Record<string, unknown>, index: number) => ({
      name:
        String(
          item.name ||
            item.func_name ||
            item.func_signature ||
            item.signature ||
            item.title ||
            `tool_${index + 1}`
        ),
      signature: typeof item.func_signature === 'string' ? item.func_signature : typeof item.signature === 'string' ? item.signature : undefined,
      description:
        typeof item.description === 'string'
          ? item.description
          : typeof item.summary === 'string'
            ? item.summary
            : undefined,
      mcp:
        typeof item.MCP === 'string'
          ? item.MCP
          : typeof item.mcp === 'string'
            ? item.mcp
            : typeof item.server === 'string'
              ? item.server
              : undefined,
      code: typeof item.code === 'string' ? item.code : undefined,
    }))
  } catch {
    return []
  }
}

function getTaskTitle(scan: Pick<Scan, 'title' | 'agentName' | 'params' | 'id'>) {
  if (typeof scan.params?.taskName === 'string') return scan.params.taskName
  if (scan.title) return scan.title
  if (scan.agentName) return scan.agentName
  return `任务 ${scan.id.slice(0, 8)}`
}

function buildMockFindings(tools: ToolMetadataItem[], types: Scan['types']) {
  const exposure: ExposureFinding[] = []
  const fuzzing: FuzzingFinding[] = []

  for (const tool of tools) {
    const text = `${tool.name} ${tool.signature || ''} ${tool.description || ''} ${tool.code || ''}`.toLowerCase()
    const looksSensitive = /(email|profile|user|content|message|doc|read|record|query|search|mail)/.test(text)
    const looksMutable = /(send|write|refund|callback|update|delete|execute|issue|external|settlement)/.test(text)

    if (types.includes('exposure') && looksSensitive) {
      exposure.push({
        id: generateId(),
        severity: exposure.length === 0 ? 'high' : 'medium',
        title: `${tool.name} 存在 DOE 风险`,
        description: '该工具读取的数据范围可能超出任务完成所需最小集合。',
        toolName: tool.name,
        toolSignature: tool.signature,
        detectionInfo: `系统识别到 ${tool.name} 可作为高敏 source 参与跨工具链路。`,
        dataType: '业务数据',
        source: tool.mcp || '未知来源',
        sinks: ['下游工具'],
        flowPath: [tool.name, 'context_merge', 'downstream_sink'],
        evidence: JSON.stringify(
          {
            tool: tool.name,
            reason: '读取型工具参与后续输出链路',
            description: tool.description || '',
          },
          null,
          2
        ),
      })
    }

    if (types.includes('fuzzing') && looksMutable) {
      fuzzing.push({
        id: generateId(),
        severity: fuzzing.length === 0 ? 'high' : 'medium',
        title: `${tool.name} 存在组合式漏洞风险`,
        description: '该工具与其他读取或检索工具串联后，可能形成越权或扩散路径。',
        toolName: tool.name,
        toolSignature: tool.signature,
        detectionInfo: `系统识别到 ${tool.name} 可作为高风险 sink 参与组合调用。`,
        attackType: '组合式调用风险',
        payloadSummary: `以 ${tool.name} 为终点的链路存在外发或状态变更能力。`,
        reproductionSteps: `1. 输入引导请求\n2. 触发读取型工具\n3. 串联 ${tool.name} 执行下游动作`,
        trace: ['source_tool', 'planner', tool.name],
        evidence: JSON.stringify(
          {
            tool: tool.name,
            mutable: true,
            description: tool.description || '',
          },
          null,
          2
        ),
      })
    }
  }

  return { exposure, fuzzing }
}

function buildMockReport(scan: Scan) {
  const tools = Array.isArray(scan.params?.parsedTools)
    ? (scan.params?.parsedTools as ToolMetadataItem[])
    : parseMetadataTools(scan.params?.metadataText)

  const findings = buildMockFindings(tools, scan.types)
  const totalFindings = findings.exposure.length + findings.fuzzing.length
  const risk =
    totalFindings === 0 ? 'low' : findings.exposure.some((item) => item.severity === 'high') || findings.fuzzing.some((item) => item.severity === 'high') ? 'high' : 'medium'

  const report: Report = {
    id: generateId(),
    agentId: scan.agentId,
    agentName: getTaskTitle(scan),
    title: getTaskTitle(scan),
    toolCount: tools.length,
    scanId: scan.id,
    createdAt: new Date().toISOString(),
    types: scan.types,
    risk,
    summary: {
      totalFindings,
      exposureFindings: findings.exposure.length,
      fuzzingFindings: findings.fuzzing.length,
      doeToolCount: findings.exposure.length,
      chainToolCount: findings.fuzzing.length,
    },
  }

  const detail: ReportDetail = {
    ...report,
    overviewText: [
      `本次共输入 ${tools.length} 个工具 metadata。`,
      findings.exposure.length > 0
        ? `发现 ${findings.exposure.length} 个 DOE 风险工具。`
        : '未发现明显的数据过度暴露工具。',
      findings.fuzzing.length > 0
        ? `发现 ${findings.fuzzing.length} 个组合式漏洞风险工具。`
        : '未发现明显的组合式漏洞风险工具。',
    ],
    exposure: { findings: findings.exposure },
    fuzzing: {
      findings: findings.fuzzing,
      stats: {
        high: findings.fuzzing.filter((item) => item.severity === 'high').length,
        medium: findings.fuzzing.filter((item) => item.severity === 'medium').length,
        low: findings.fuzzing.filter((item) => item.severity === 'low').length,
      },
    },
    recommendations: [
      '优先限制读取型工具的字段范围，避免超出任务上下文的资料进入链路。',
      '对写入、外发、回调类工具增加显式权限校验与执行白名单。',
      '对高风险 source 到 sink 组合建立审计规则与人工复核流程。',
    ],
    raw: {
      tools,
      selectedChecks: scan.types,
      metadataFilename: scan.params?.metadataFilename,
      affectedTools: {
        exposure: findings.exposure.map((item) => item.toolName),
        fuzzing: findings.fuzzing.map((item) => item.toolName),
      },
    },
  }

  return { report, detail }
}

export async function listAgents(): Promise<Agent[]> {
  if (USE_MOCK) {
    await sleep(150)
    return [...mockState.agents]
  }
  return fetchApi<Agent[]>('/agents')
}

export async function getAgent(id: string): Promise<Agent | null> {
  if (USE_MOCK) {
    await sleep(120)
    return mockState.agents.find((item) => item.id === id) || null
  }
  return fetchApi<Agent>(`/agents/${id}`)
}

export async function createAgent(payload: Partial<Agent>): Promise<Agent> {
  if (USE_MOCK) {
    await sleep(200)
    const newAgent: Agent = {
      id: generateId(),
      name: payload.name || '工具 metadata 批次',
      inputType: payload.inputType || 'spec_upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
      toolCount: payload.toolCount ?? 0,
      highRiskToolCount: payload.highRiskToolCount ?? 0,
    }
    mockState.agents.unshift(newAgent)
    return newAgent
  }
  return fetchApi<Agent>('/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAgent(id: string, payload: Partial<Agent>): Promise<Agent> {
  if (USE_MOCK) {
    await sleep(200)
    const index = mockState.agents.findIndex((item) => item.id === id)
    if (index === -1) throw new Error('未找到对象')
    mockState.agents[index] = {
      ...mockState.agents[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    }
    return mockState.agents[index]
  }
  return fetchApi<Agent>(`/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteAgent(id: string): Promise<void> {
  if (USE_MOCK) {
    await sleep(150)
    const index = mockState.agents.findIndex((item) => item.id === id)
    if (index !== -1) {
      mockState.agents.splice(index, 1)
    }
    return
  }
  await fetchApi(`/agents/${id}`, { method: 'DELETE' })
}

export async function listScans(query?: { agentId?: string }): Promise<Scan[]> {
  if (USE_MOCK) {
    await sleep(180)
    let scans = [...mockState.scans]
    if (query?.agentId) {
      scans = scans.filter((item) => item.agentId === query.agentId)
    }
    return scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  const params = new URLSearchParams(query as Record<string, string>)
  return fetchApi<Scan[]>(`/scans?${params}`)
}

export async function getScan(id: string): Promise<Scan | null> {
  if (USE_MOCK) {
    await sleep(160)
    const scan = mockState.scans.find((item) => item.id === id)
    if (!scan) return null

    if (scan.status === 'queued' || scan.status === 'running') {
      if (!scan.progress) {
        scan.progress = { stage: 'parse', percent: 0 }
      }

      scan.status = 'running'
      if (!scan.startedAt) {
        scan.startedAt = new Date().toISOString()
      }

      const stages: ScanProgress['stage'][] = ['parse', 'precheck', 'run', 'aggregate', 'done']
      const currentIndex = stages.indexOf(scan.progress.stage)

      scan.progress.percent = Math.min(scan.progress.percent + 12, 100)

      if (scan.progress.percent >= 100) {
        scan.status = 'succeeded'
        scan.progress.stage = 'done'
        scan.progress.message = '双检测完成，报告已生成。'
        scan.finishedAt = new Date().toISOString()
        scan.durationMs = Date.now() - new Date(scan.startedAt || scan.createdAt).getTime()

        if (!scan.reportId) {
          const generated = buildMockReport(scan)
          scan.reportId = generated.report.id
          mockState.reports.unshift(generated.report)
          mockState.reportDetails[generated.report.id] = generated.detail
        }
      } else if (scan.progress.percent > 18 && currentIndex < 1) {
        scan.progress.stage = 'precheck'
        scan.progress.message = '正在校验 metadata 结构和检测范围。'
      } else if (scan.progress.percent > 42 && currentIndex < 2) {
        scan.progress.stage = 'run'
        scan.progress.message = '正在执行 DOE 与组合式漏洞双检测。'
      } else if (scan.progress.percent > 76 && currentIndex < 3) {
        scan.progress.stage = 'aggregate'
        scan.progress.message = '正在整理工具级检测结果。'
      }
    }

    return scan
  }
  return fetchApi<Scan>(`/scans/${id}`)
}

export async function createScan(payload: {
  agentId?: string
  title?: string
  types: string[]
  params?: Record<string, unknown>
}): Promise<Scan> {
  if (USE_MOCK) {
    await sleep(280)
    const tools = parseMetadataTools(payload.params?.metadataText)
    const taskName =
      payload.title ||
      (typeof payload.params?.taskName === 'string' ? payload.params.taskName : '') ||
      `工具 metadata 扫描 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`

    const newScan: Scan = {
      id: generateId(),
      agentId: payload.agentId || DEFAULT_AGENT_ID,
      agentName: taskName,
      title: taskName,
      types: payload.types as Scan['types'],
      status: 'queued',
      createdAt: new Date().toISOString(),
      params: {
        ...payload.params,
        taskName,
        toolCount: tools.length,
        parsedTools: tools,
        selectedChecks: payload.types,
      },
      progress: {
        stage: 'parse',
        percent: 0,
        message: '任务已创建，等待执行。',
      },
    }

    mockState.scans.unshift(newScan)
    return newScan
  }
  return fetchApi<Scan>('/scans', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function cancelScan(id: string): Promise<Scan> {
  if (USE_MOCK) {
    await sleep(150)
    const scan = mockState.scans.find((item) => item.id === id)
    if (!scan) throw new Error('未找到任务')
    if (scan.status === 'queued' || scan.status === 'running') {
      scan.status = 'canceled'
      scan.finishedAt = new Date().toISOString()
      scan.progress = {
        stage: scan.progress?.stage || 'run',
        percent: scan.progress?.percent || 0,
        message: '任务已取消。',
      }
    }
    return scan
  }
  return fetchApi<Scan>(`/scans/${id}/cancel`, { method: 'POST' })
}

export async function getScanLogs(id: string): Promise<LogEntry[]> {
  if (USE_MOCK) {
    await sleep(100)
    const scan = mockState.scans.find((item) => item.id === id)
    if (!scan) return []
    const logCount = scan.progress?.percent ? Math.floor(scan.progress.percent / 12) + 1 : 1
    return generateMockLogs(logCount)
  }
  return fetchApi<LogEntry[]>(`/scans/${id}/logs`)
}

export async function listReports(query?: {
  agentId?: string
  risk?: string
  type?: string
}): Promise<Report[]> {
  if (USE_MOCK) {
    await sleep(180)
    let reports = [...mockState.reports]
    if (query?.agentId) {
      reports = reports.filter((item) => item.agentId === query.agentId)
    }
    if (query?.risk) {
      reports = reports.filter((item) => item.risk === query.risk)
    }
    if (query?.type) {
      reports = reports.filter((item) => item.types.includes(query.type as 'exposure' | 'fuzzing'))
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  const params = new URLSearchParams(query as Record<string, string>)
  return fetchApi<Report[]>(`/reports?${params}`)
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  if (USE_MOCK) {
    await sleep(200)
    if (mockState.reportDetails[id]) {
      return mockState.reportDetails[id]
    }
    const report = mockState.reports.find((item) => item.id === id)
    if (!report) return null
    return {
      ...report,
      overviewText: ['当前报告正在初始化详细视图。'],
      recommendations: ['建议重新运行一次任务，生成完整报告。'],
    }
  }
  return fetchApi<ReportDetail>(`/reports/${id}`)
}

export async function downloadReport(id: string, format: 'pdf' | 'json'): Promise<Blob> {
  if (USE_MOCK) {
    await sleep(180)
    const report = await getReportDetail(id)
    const content =
      format === 'json'
        ? JSON.stringify(report, null, 2)
        : `SAFE-Agent Report ${id}\n\n${JSON.stringify(report, null, 2)}`
    return new Blob([content], {
      type: format === 'json' ? 'application/json' : 'application/pdf',
    })
  }
  const response = await fetch(`${API_BASE}/reports/${id}/download?format=${format}`)
  return response.blob()
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK) {
    await sleep(120)
    return {
      ...mockDashboardStats,
      recentScanCount: mockState.scans.filter(
        (item) => new Date(item.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      failedScanCount: mockState.scans.filter((item) => item.status === 'failed').length,
      highRiskReportCount: mockState.reports.filter((item) => item.risk === 'high').length,
    }
  }
  return fetchApi<DashboardStats>('/dashboard/stats')
}

export async function listDoeLibraryCases(): Promise<DoeLibraryCase[]> {
  if (USE_MOCK) {
    await sleep(120)
    return []
  }

  return fetchApi<DoeLibraryCase[]>('/doe-library')
}

export async function testConnection(url: string, authType: string, apiKey?: string): Promise<boolean> {
  if (USE_MOCK) {
    await sleep(500)
    return Boolean(url) && (authType === 'none' || Boolean(apiKey) || authType === 'bearer')
  }
  const response = await fetchApi<{ success: boolean }>('/utils/test-connection', {
    method: 'POST',
    body: JSON.stringify({ url, authType, apiKey }),
  })
  return response.success
}
