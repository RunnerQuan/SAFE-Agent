import { Agent, DashboardStats, LogEntry, Report, ReportDetail, Scan, ToolMetadataItem } from './types'
import { generateId } from './utils'

const defaultTools: ToolMetadataItem[] = [
  {
    name: 'get_user_profile',
    signature: 'get_user_profile(user_id: string)',
    description: '读取用户基础资料与账户信息',
    mcp: 'CRM',
    code: 'def get_user_profile(user_id): ...',
  },
  {
    name: 'read_email_content',
    signature: 'read_email_content(message_id: string)',
    description: '读取邮件正文与附件摘要',
    mcp: 'Mail',
    code: 'def read_email_content(message_id): ...',
  },
  {
    name: 'send_external_message',
    signature: 'send_external_message(channel: string, content: string)',
    description: '向外部渠道发送通知消息',
    mcp: 'Messaging',
    code: 'def send_external_message(channel, content): ...',
  },
  {
    name: 'update_ticket_status',
    signature: 'update_ticket_status(ticket_id: string, status: string)',
    description: '更新客服工单状态',
    mcp: 'Support',
    code: 'def update_ticket_status(ticket_id, status): ...',
  },
  {
    name: 'query_internal_docs',
    signature: 'query_internal_docs(keyword: string)',
    description: '搜索内部知识库与运维文档',
    mcp: 'Docs',
    code: 'def query_internal_docs(keyword): ...',
  },
  {
    name: 'issue_refund',
    signature: 'issue_refund(order_id: string, amount: number)',
    description: '执行退款流程并写入财务系统',
    mcp: 'Finance',
    code: 'def issue_refund(order_id, amount): ...',
  },
]

const secondaryTools: ToolMetadataItem[] = [
  {
    name: 'get_order_record',
    signature: 'get_order_record(order_id: string)',
    description: '读取订单详情与用户历史记录',
    mcp: 'Order',
    code: 'def get_order_record(order_id): ...',
  },
  {
    name: 'write_settlement_log',
    signature: 'write_settlement_log(record: object)',
    description: '写入结算日志并触发财务归档',
    mcp: 'Finance',
    code: 'def write_settlement_log(record): ...',
  },
  {
    name: 'send_partner_callback',
    signature: 'send_partner_callback(payload: object)',
    description: '将处理结果回调至第三方系统',
    mcp: 'Webhook',
    code: 'def send_partner_callback(payload): ...',
  },
  {
    name: 'search_knowledge_base',
    signature: 'search_knowledge_base(question: string)',
    description: '检索知识库并返回片段',
    mcp: 'Docs',
    code: 'def search_knowledge_base(question): ...',
  },
]

export const mockAgents: Agent[] = [
  {
    id: 'tool-batch',
    name: '工具 metadata 批次',
    description: '内部默认对象，用于承接工具 metadata 列表扫描。',
    inputType: 'spec_upload',
    createdAt: '2026-03-20T09:00:00Z',
    updatedAt: '2026-03-27T08:00:00Z',
    specFilename: 'tools.json',
    toolCount: defaultTools.length,
    highRiskToolCount: 3,
    lastScanAt: '2026-03-27T08:20:00Z',
  },
]

export const mockScans: Scan[] = [
  {
    id: 'scan-001',
    agentId: 'tool-batch',
    agentName: '办公工具链 metadata 扫描',
    title: '办公工具链 metadata 扫描',
    types: ['exposure', 'fuzzing'],
    status: 'succeeded',
    createdAt: '2026-03-27T08:00:00Z',
    startedAt: '2026-03-27T08:00:05Z',
    finishedAt: '2026-03-27T08:08:40Z',
    durationMs: 515000,
    progress: { stage: 'done', percent: 100, message: '检测完成，报告已生成。' },
    reportId: 'report-001',
    params: {
      taskName: '办公工具链 metadata 扫描',
      toolCount: defaultTools.length,
      selectedChecks: ['exposure', 'fuzzing'],
      metadataFilename: 'office-tools.json',
      parsedTools: defaultTools,
    },
  },
  {
    id: 'scan-002',
    agentId: 'tool-batch',
    agentName: '客服工具集批量检测',
    title: '客服工具集批量检测',
    types: ['exposure', 'fuzzing'],
    status: 'running',
    createdAt: '2026-03-27T10:00:00Z',
    startedAt: '2026-03-27T10:00:03Z',
    progress: { stage: 'run', percent: 62, message: '正在基于 source 到 sink 链路生成双检测结果。' },
    params: {
      taskName: '客服工具集批量检测',
      toolCount: secondaryTools.length,
      selectedChecks: ['exposure', 'fuzzing'],
      metadataFilename: 'support-tools.json',
      parsedTools: secondaryTools,
    },
  },
  {
    id: 'scan-003',
    agentId: 'tool-batch',
    agentName: '财务插件安全扫描',
    title: '财务插件安全扫描',
    types: ['exposure'],
    status: 'failed',
    createdAt: '2026-03-26T16:00:00Z',
    startedAt: '2026-03-26T16:00:04Z',
    finishedAt: '2026-03-26T16:03:14Z',
    durationMs: 190000,
    progress: { stage: 'run', percent: 44, message: '调用图构建阶段出现异常，请检查 metadata 结构。' },
    params: {
      taskName: '财务插件安全扫描',
      toolCount: 3,
      selectedChecks: ['exposure'],
      metadataFilename: 'finance-tools.json',
      parsedTools: secondaryTools.slice(0, 3),
    },
  },
]

export const mockReports: Report[] = [
  {
    id: 'report-001',
    agentId: 'tool-batch',
    agentName: '办公工具链 metadata 扫描',
    title: '办公工具链 metadata 扫描',
    toolCount: defaultTools.length,
    scanId: 'scan-001',
    createdAt: '2026-03-27T08:08:40Z',
    types: ['exposure', 'fuzzing'],
    risk: 'high',
    summary: {
      totalFindings: 5,
      exposureFindings: 2,
      fuzzingFindings: 3,
      doeToolCount: 2,
      chainToolCount: 3,
    },
  },
  {
    id: 'report-002',
    agentId: 'tool-batch',
    agentName: '支付工具链复核',
    title: '支付工具链复核',
    toolCount: secondaryTools.length,
    scanId: 'scan-004',
    createdAt: '2026-03-26T11:20:00Z',
    types: ['exposure', 'fuzzing'],
    risk: 'medium',
    summary: {
      totalFindings: 3,
      exposureFindings: 1,
      fuzzingFindings: 2,
      doeToolCount: 1,
      chainToolCount: 2,
    },
  },
]

export const mockReportDetails: Record<string, ReportDetail> = {
  'report-001': {
    ...mockReports[0],
    overviewText: [
      '本次输入包含 6 个工具 metadata，双检测均已执行完成。',
      'DOE 风险主要集中在读取类工具与外发类工具的串联使用上。',
      '组合式漏洞主要出现在跨系统写入和回调路径，存在越权调用与链路放大风险。',
    ],
    exposure: {
      findings: [
        {
          id: 'doe-001',
          severity: 'high',
          title: '邮件内容可沿外发链路泄露',
          description: '读取邮件正文后，可经消息工具直接外发，超出任务目标所需数据范围。',
          toolName: 'read_email_content',
          toolSignature: 'read_email_content(message_id: string)',
          detectionInfo: 'source: read_email_content -> sink: send_external_message',
          dataType: '邮件内容',
          source: 'Mail',
          sinks: ['Messaging'],
          flowPath: ['read_email_content', 'summarize_message', 'send_external_message'],
          evidence: JSON.stringify(
            {
              prompt: '读取一封内部邮件并转发给外部联系人。',
              leaked_fields: ['subject', 'body', 'attachment_summary'],
            },
            null,
            2
          ),
        },
        {
          id: 'doe-002',
          severity: 'medium',
          title: '用户资料在工单更新任务中被过度读取',
          description: '更新工单状态仅需最小字段，但链路中读取了完整用户资料。',
          toolName: 'get_user_profile',
          toolSignature: 'get_user_profile(user_id: string)',
          detectionInfo: 'source: get_user_profile -> sink: update_ticket_status',
          dataType: '个人资料',
          source: 'CRM',
          sinks: ['Support'],
          flowPath: ['get_user_profile', 'merge_ticket_context', 'update_ticket_status'],
          evidence: JSON.stringify(
            {
              expected_scope: ['ticket_id', 'status'],
              actual_scope: ['name', 'email', 'phone', 'membership_level'],
            },
            null,
            2
          ),
        },
      ],
    },
    fuzzing: {
      findings: [
        {
          id: 'chain-001',
          severity: 'high',
          title: '退款与外部回调组合存在越权路径',
          description: '攻击者可借由退款工具与外发回调的组合，触发不应开放的资金状态同步。',
          toolName: 'issue_refund',
          toolSignature: 'issue_refund(order_id: string, amount: number)',
          detectionInfo: 'issue_refund + send_external_message 形成高风险组合调用',
          attackType: '组合式越权调用',
          payloadSummary: '以客服追单场景引导执行退款并同步给外部联系通道。',
          reproductionSteps: '1. 构造客服场景请求\n2. 诱导系统读取订单与邮件内容\n3. 触发退款并发送外部通知',
          trace: ['get_user_profile', 'issue_refund', 'send_external_message'],
          evidence: JSON.stringify(
            {
              affected_actions: ['refund', 'external_notification'],
              risk: 'high',
            },
            null,
            2
          ),
        },
        {
          id: 'chain-002',
          severity: 'medium',
          title: '知识库查询可串联内部文档与外发工具',
          description: '内部知识片段被组合到外发消息中，存在信息扩散风险。',
          toolName: 'query_internal_docs',
          toolSignature: 'query_internal_docs(keyword: string)',
          detectionInfo: 'query_internal_docs + send_external_message',
          attackType: '链路拼接扩散',
          payloadSummary: '先查文档，再通过消息工具输出给第三方。',
          trace: ['query_internal_docs', 'compose_message', 'send_external_message'],
        },
        {
          id: 'chain-003',
          severity: 'low',
          title: '工单状态更新可被连续工具调用放大',
          description: '工单更新与资料读取组合后，容易形成多工具连续执行。',
          toolName: 'update_ticket_status',
          toolSignature: 'update_ticket_status(ticket_id: string, status: string)',
          detectionInfo: 'update_ticket_status + get_user_profile',
          attackType: '连续工具放大',
          payloadSummary: '通过看似正常的客服场景放大工具调用范围。',
        },
      ],
      stats: {
        high: 1,
        medium: 1,
        low: 1,
      },
    },
    recommendations: [
      '对读取类工具施加最小字段约束，避免把完整资料带入后续链路。',
      '对高风险外发工具启用显式审批，阻断跨系统串联执行。',
      '对 source 到 sink 的高风险路径建立白名单和上下文校验。',
    ],
    raw: {
      tools: defaultTools,
      selectedChecks: ['exposure', 'fuzzing'],
      metadataFilename: 'office-tools.json',
      affectedTools: {
        exposure: ['read_email_content', 'get_user_profile'],
        fuzzing: ['issue_refund', 'query_internal_docs', 'update_ticket_status'],
      },
    },
  },
  'report-002': {
    ...mockReports[1],
    overviewText: [
      '本次批量检测聚焦支付与回调工具链。',
      'DOE 风险较少，但组合式漏洞链路仍需重点关注。',
    ],
    exposure: {
      findings: [
        {
          id: 'doe-101',
          severity: 'medium',
          title: '订单记录读取超出结算任务范围',
          description: '结算日志任务仅需订单号与金额，但读取了额外用户历史字段。',
          toolName: 'get_order_record',
          toolSignature: 'get_order_record(order_id: string)',
          detectionInfo: 'source: get_order_record -> sink: write_settlement_log',
          dataType: '订单记录',
          flowPath: ['get_order_record', 'normalize_settlement_data', 'write_settlement_log'],
        },
      ],
    },
    fuzzing: {
      findings: [
        {
          id: 'chain-101',
          severity: 'medium',
          title: '结算日志与回调接口可形成外部可见链路',
          description: '内部结算状态可通过组合调用被发送到外部伙伴系统。',
          toolName: 'send_partner_callback',
          toolSignature: 'send_partner_callback(payload: object)',
          detectionInfo: 'write_settlement_log + send_partner_callback',
          attackType: '组合式外泄链路',
          payloadSummary: '结算日志写入后自动触发回调。',
        },
        {
          id: 'chain-102',
          severity: 'low',
          title: '知识库检索可参与回调参数拼接',
          description: '检索结果可能被混入回调内容，导致不必要信息扩散。',
          toolName: 'search_knowledge_base',
          toolSignature: 'search_knowledge_base(question: string)',
          detectionInfo: 'search_knowledge_base + send_partner_callback',
          attackType: '检索拼接风险',
        },
      ],
      stats: {
        medium: 1,
        low: 1,
      },
    },
    recommendations: [
      '限制结算日志写入任务的字段范围，并对外发回调做字段白名单过滤。',
      '对回调 payload 建立模板校验，避免拼接非必要检索结果。',
    ],
    raw: {
      tools: secondaryTools,
      selectedChecks: ['exposure', 'fuzzing'],
      metadataFilename: 'payment-tools.json',
      affectedTools: {
        exposure: ['get_order_record'],
        fuzzing: ['send_partner_callback', 'search_knowledge_base'],
      },
    },
  },
}

export function generateMockLogs(count: number = 5): LogEntry[] {
  const templates = [
    { level: 'info' as const, message: '开始解析工具 metadata 列表。' },
    { level: 'info' as const, message: '检测到工具签名与描述字段，输入结构有效。' },
    { level: 'info' as const, message: '正在构建 source 到 sink 的调用链路。' },
    { level: 'info' as const, message: '正在执行数据过度暴露检测。' },
    { level: 'info' as const, message: '正在执行组合式漏洞检测。' },
    { level: 'warn' as const, message: '部分工具描述过短，判定结果将偏保守。' },
    { level: 'info' as const, message: '正在聚合工具级检测结论。' },
    { level: 'error' as const, message: '单个工具路径构建失败，已跳过并继续任务。' },
  ]

  return Array.from({ length: count }, (_, index) => {
    const template = templates[Math.min(index, templates.length - 1)]
    return {
      id: generateId(),
      timestamp: new Date(Date.now() - (count - index) * 15000).toISOString(),
      level: template.level,
      message: template.message,
    }
  })
}

export const mockDashboardStats: DashboardStats = {
  agentCount: mockAgents.length,
  recentScanCount: mockScans.filter(
    (scan) => new Date(scan.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length,
  failedScanCount: mockScans.filter((scan) => scan.status === 'failed').length,
  highRiskReportCount: mockReports.filter((report) => report.risk === 'high').length,
}

export const mockState = {
  agents: [...mockAgents],
  scans: [...mockScans],
  reports: [...mockReports],
  reportDetails: { ...mockReportDetails },
}
