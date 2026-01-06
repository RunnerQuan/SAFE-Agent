import { Agent, Scan, Report, ReportDetail, LogEntry, DashboardStats, ScanProgress } from './types'
import { mockState, mockDashboardStats, generateMockLogs, mockReportDetails } from './mockData'
import { generateId, sleep } from './utils'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
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

// ============ AGENTS ============

export async function listAgents(): Promise<Agent[]> {
  if (USE_MOCK) {
    await sleep(300)
    return [...mockState.agents]
  }
  return fetchApi<Agent[]>('/agents')
}

export async function getAgent(id: string): Promise<Agent | null> {
  if (USE_MOCK) {
    await sleep(200)
    return mockState.agents.find(a => a.id === id) || null
  }
  return fetchApi<Agent>(`/agents/${id}`)
}

export async function createAgent(payload: Partial<Agent>): Promise<Agent> {
  if (USE_MOCK) {
    await sleep(500)
    const newAgent: Agent = {
      id: generateId(),
      name: payload.name || 'New Agent',
      inputType: payload.inputType || 'endpoint',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
      toolCount: Math.floor(Math.random() * 20) + 5,
      highRiskToolCount: Math.floor(Math.random() * 5),
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
    await sleep(400)
    const index = mockState.agents.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Agent not found')
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
    await sleep(300)
    const index = mockState.agents.findIndex(a => a.id === id)
    if (index !== -1) {
      mockState.agents.splice(index, 1)
    }
    return
  }
  await fetchApi(`/agents/${id}`, { method: 'DELETE' })
}

// ============ SCANS ============

export async function listScans(query?: { agentId?: string }): Promise<Scan[]> {
  if (USE_MOCK) {
    await sleep(300)
    let scans = [...mockState.scans]
    if (query?.agentId) {
      scans = scans.filter(s => s.agentId === query.agentId)
    }
    return scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  const params = new URLSearchParams(query as Record<string, string>)
  return fetchApi<Scan[]>(`/scans?${params}`)
}

export async function getScan(id: string): Promise<Scan | null> {
  if (USE_MOCK) {
    await sleep(200)
    const scan = mockState.scans.find(s => s.id === id)
    if (scan && (scan.status === 'queued' || scan.status === 'running')) {
      // Simulate progress
      if (!scan.progress) {
        scan.progress = { stage: 'parse', percent: 0 }
      }
      const stages: ScanProgress['stage'][] = ['parse', 'precheck', 'run', 'aggregate', 'done']
      const currentStageIndex = stages.indexOf(scan.progress.stage)

      scan.progress.percent = Math.min(scan.progress.percent + 10, 100)

      if (scan.progress.percent >= 100) {
        scan.status = 'succeeded'
        scan.progress.stage = 'done'
        scan.finishedAt = new Date().toISOString()
        scan.durationMs = Date.now() - new Date(scan.startedAt || scan.createdAt).getTime()

        // Generate report
        const reportId = generateId()
        scan.reportId = reportId
        const newReport: Report = {
          id: reportId,
          agentId: scan.agentId,
          agentName: scan.agentName,
          scanId: scan.id,
          createdAt: new Date().toISOString(),
          types: scan.types,
          risk: Math.random() > 0.5 ? 'high' : 'medium',
          summary: {
            totalFindings: Math.floor(Math.random() * 15) + 3,
            exposureFindings: scan.types.includes('exposure') ? Math.floor(Math.random() * 8) + 1 : undefined,
            fuzzingFindings: scan.types.includes('fuzzing') ? Math.floor(Math.random() * 8) + 1 : undefined,
          },
        }
        mockState.reports.unshift(newReport)
      } else if (scan.progress.percent > 20 && currentStageIndex < 2) {
        scan.progress.stage = 'precheck'
        scan.status = 'running'
        if (!scan.startedAt) scan.startedAt = new Date().toISOString()
      } else if (scan.progress.percent > 40 && currentStageIndex < 3) {
        scan.progress.stage = 'run'
        scan.progress.message = '正在执行检测...'
      } else if (scan.progress.percent > 80 && currentStageIndex < 4) {
        scan.progress.stage = 'aggregate'
        scan.progress.message = '正在汇总结果...'
      }
    }
    return scan || null
  }
  return fetchApi<Scan>(`/scans/${id}`)
}

export async function createScan(payload: {
  agentId: string
  types: string[]
  params?: Record<string, unknown>
}): Promise<Scan> {
  if (USE_MOCK) {
    await sleep(500)
    const agent = mockState.agents.find(a => a.id === payload.agentId)
    const newScan: Scan = {
      id: generateId(),
      agentId: payload.agentId,
      agentName: agent?.name,
      types: payload.types as Scan['types'],
      status: 'queued',
      createdAt: new Date().toISOString(),
      params: payload.params,
      progress: { stage: 'parse', percent: 0 },
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
    await sleep(300)
    const scan = mockState.scans.find(s => s.id === id)
    if (scan && (scan.status === 'queued' || scan.status === 'running')) {
      scan.status = 'canceled'
      scan.finishedAt = new Date().toISOString()
    }
    return scan!
  }
  return fetchApi<Scan>(`/scans/${id}/cancel`, { method: 'POST' })
}

export async function getScanLogs(id: string): Promise<LogEntry[]> {
  if (USE_MOCK) {
    await sleep(100)
    const scan = mockState.scans.find(s => s.id === id)
    if (!scan) return []
    const logCount = scan.progress?.percent ? Math.floor(scan.progress.percent / 10) + 1 : 1
    return generateMockLogs(logCount)
  }
  return fetchApi<LogEntry[]>(`/scans/${id}/logs`)
}

// ============ REPORTS ============

export async function listReports(query?: {
  agentId?: string
  risk?: string
  type?: string
}): Promise<Report[]> {
  if (USE_MOCK) {
    await sleep(300)
    let reports = [...mockState.reports]
    if (query?.agentId) {
      reports = reports.filter(r => r.agentId === query.agentId)
    }
    if (query?.risk) {
      reports = reports.filter(r => r.risk === query.risk)
    }
    if (query?.type) {
      reports = reports.filter(r => r.types.includes(query.type as 'exposure' | 'fuzzing'))
    }
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  const params = new URLSearchParams(query as Record<string, string>)
  return fetchApi<Report[]>(`/reports?${params}`)
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  if (USE_MOCK) {
    await sleep(400)
    // Check if we have a detailed report
    if (mockReportDetails[id]) {
      return mockReportDetails[id]
    }
    // Generate a basic detail from the report
    const report = mockState.reports.find(r => r.id === id)
    if (!report) return null
    return {
      ...report,
      overviewText: ['检测完成，请查看详细报告。'],
      recommendations: ['建议定期进行安全扫描', '及时更新依赖包'],
    }
  }
  return fetchApi<ReportDetail>(`/reports/${id}`)
}

export async function downloadReport(id: string, format: 'pdf' | 'json'): Promise<Blob> {
  if (USE_MOCK) {
    await sleep(500)
    const report = await getReportDetail(id)
    const content = format === 'json'
      ? JSON.stringify(report, null, 2)
      : `Report ${id}\n\nThis is a mock PDF export.\n\n${JSON.stringify(report, null, 2)}`
    return new Blob([content], { type: format === 'json' ? 'application/json' : 'application/pdf' })
  }
  const response = await fetch(`${API_BASE}/reports/${id}/download?format=${format}`)
  return response.blob()
}

// ============ DASHBOARD ============

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK) {
    await sleep(200)
    return {
      agentCount: mockState.agents.length,
      recentScanCount: mockState.scans.filter(s =>
        new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      failedScanCount: mockState.scans.filter(s => s.status === 'failed').length,
      highRiskReportCount: mockState.reports.filter(r => r.risk === 'high').length,
    }
  }
  return fetchApi<DashboardStats>('/dashboard/stats')
}

// ============ UTILITIES ============

export async function testConnection(url: string, authType: string, apiKey?: string): Promise<boolean> {
  if (USE_MOCK) {
    await sleep(1000)
    // Simulate random success/failure for demo
    return Math.random() > 0.3
  }
  const response = await fetchApi<{ success: boolean }>('/utils/test-connection', {
    method: 'POST',
    body: JSON.stringify({ url, authType, apiKey }),
  })
  return response.success
}
