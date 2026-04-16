const categoryLabelMap: Record<string, string> = {
  description: '描述',
  'description gap': '描述缺口',
  description_gap: '描述缺口',
  descriptiongap: '描述缺口',
  '描述gap': '描述缺口',
  summary: '摘要',
  metadata: '元数据',
  documentation: '文档',
  technical_docs: '技术文档',
  active_malice: '主动恶意',
  'active malice': '主动恶意',
  access_boundary_risk: '访问边界风险',
  'access boundary risk': '访问边界风险',
  data_governance_risk: '数据治理风险',
  'data governance risk': '数据治理风险',
  execution_system_risk: '执行与系统风险',
  'execution / system risk': '执行与系统风险',
  marketplace: 'Marketplace',
  clawhub: 'Clawhub',
  description_scan: '说明扫描',
  'description scan': '说明扫描',
  script_scan: '脚本扫描',
  'script scan': '脚本扫描',
  input_validation: '输入校验',
  'input validation': '输入校验',
  subprocess: '子进程',
  path_traversal: '路径穿越',
  'path traversal': '路径穿越',
  other: '其他',
  explicit_malicious_behavior: '显式恶意行为',
  trojan_downloader: '木马下载/投毒',
  'trojan downloader': '木马下载/投毒',
  data_exfiltration: '数据外传',
  'data exfiltration': '数据外传',
  data_over_collection: '数据过度收集',
  'data over collection': '数据过度收集',
  'data over-collection': '数据过度收集',
  privacy_violation: '隐私侵犯',
  'privacy violation': '隐私侵犯',
  permission_overreach: '权限越界',
  'permission overreach': '权限越界',
  'permission overreach (action)': '权限越界（动作）',
  privilege_escalation: '权限提升',
  'privilege escalation': '权限提升',
  security_risk: '安全风险',
  'security risk': '安全风险',
  supply_chain: '供应链',
  'supply chain': '供应链',
  supply_chain_attack: '供应链攻击',
  'supply chain attack': '供应链攻击',
  reverse_shell: '反向 Shell',
  'reverse shell': '反向 Shell',
  evasion_technique: '规避技术',
  'evasion technique': '规避技术',
  collection_of_web_shells: 'Web Shell 收集',
  'collection of web shells': 'Web Shell 收集',
  browser_automation: '浏览器自动化',
  browser_session_or_credentials: '浏览器会话/凭据',
  remote_command_execution: '远程命令执行',
  'remote command execution': '远程命令执行',
  external_communication: '外部通信',
  obfuscated_execution: '混淆执行',
  filesystem_access: '文件系统访问',
  credential_access: '凭据访问',
  env_access: '环境变量访问',
  secret_access: '敏感信息访问',
  shell_or_command_execution: '命令执行',
  malicious: '恶意',
  suspicious: '可疑',
  overreach: '越界',
  safe: '安全',
  implementation: '实现层',
  configuration: '配置',
  network: '网络',
  authentication: '身份认证',
  authorization: '权限授权',
  injection: '注入',
  'code execution': '代码执行',
  code_execution: '代码执行',
  'command execution': '命令执行',
  command_execution: '命令执行',
  'file access': '文件访问',
  file_access: '文件访问',
  'file write': '文件写入',
  file_write: '文件写入',
  'file read': '文件读取',
  file_read: '文件读取',
  'tool use': '工具调用',
  tool_use: '工具调用',
  'tool access': '工具访问',
  tool_access: '工具访问',
  'prompt injection': '提示词注入',
  prompt_injection: '提示词注入',
  'information disclosure': '信息泄露',
  information_disclosure: '信息泄露',
  'insecure design': '不安全设计',
  insecure_design: '不安全设计',
  'access control': '访问控制',
  access_control: '访问控制',
  control: '控制',
  tampering: '篡改',
  'system tampering': '系统篡改',
  system_tampering: '系统篡改',
  '系统tampering': '系统篡改',
  '访问control': '访问控制',
  destructive: '破坏性',
  ops: '操作',
  destructiveops: '破坏性操作',
  'destructive ops': '破坏性操作',
  destructive_ops: '破坏性操作',
  'capability abuse': '能力滥用',
  capability_abuse: '能力滥用',
  'scope violation': '范围越界',
  scope_violation: '范围越界',
  'data access': '数据访问',
  data_access: '数据访问',
  'side effect': '副作用',
  side_effect: '副作用',
  logging: '日志',
  monitoring: '监控',
  validation: '校验',
  sanitization: '净化处理',
  encryption: '加密',
  storage: '存储',
  execution: '执行',
  runtime: '运行时',
  design: '设计',
  logic: '业务逻辑',
  api: 'API',
  web: 'Web',
  system: '系统',
  process: '进程',
  memory: '内存',
  crypto: '加密',
  session: '会话',
  token: '令牌',
  cookie: 'Cookie',
  header: '请求头',
  'sql injection': 'SQL 注入',
  sql_injection: 'SQL 注入',
  xss: 'XSS 跨站脚本',
  ssrf: 'SSRF 服务端请求伪造',
  csrf: 'CSRF 跨站请求伪造',
  rce: '远程代码执行',
  lfi: '本地文件包含',
  rfi: '远程文件包含',
  gap: '缺口',
}

export function normalizeLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function translateLabel(value?: string): string {
  if (!value) return ''

  const raw = String(value).trim()
  if (raw.includes('|')) {
    return raw
      .split('|')
      .map((item) => translateLabel(item))
      .filter(Boolean)
      .join('、')
  }

  const mapped = categoryLabelMap[raw] || categoryLabelMap[raw.toLowerCase()]
  if (mapped) return mapped

  const normalized = normalizeLabel(raw)
  const condensed = normalized.toLowerCase().replace(/\s+/g, '')
  const mappedNorm =
    categoryLabelMap[normalized] ||
    categoryLabelMap[normalized.toLowerCase()] ||
    categoryLabelMap[condensed]
  if (mappedNorm) return mappedNorm

  const mixedZhEn = raw
    .replace(/([\u4e00-\u9fa5]+)([a-zA-Z_]+)/g, (_, zh, en) => {
      const enMapped = categoryLabelMap[en.toLowerCase()]
      return enMapped ? zh + enMapped : zh + en
    })
    .replace(/([a-zA-Z_]+)([\u4e00-\u9fa5]+)/g, (_, en, zh) => {
      const enMapped = categoryLabelMap[en.toLowerCase()]
      return enMapped ? enMapped + zh : en + zh
    })
  if (mixedZhEn !== raw) {
    return mixedZhEn
  }

  const parts = normalized.split(' ').filter(Boolean)
  const translated = parts.map((part) => categoryLabelMap[part.toLowerCase()] || null)
  if (translated.every(Boolean)) {
    return translated.join('')
  }

  const mixed = parts.map((part, index) => {
    const translatedPart = categoryLabelMap[part.toLowerCase()]
    if (translatedPart) return translatedPart
    return index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part
  })
  return mixed.join(' ')
}

function normalizeScore(value?: number) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  if (numeric <= 1) return numeric * 10
  if (numeric <= 10) return numeric
  if (numeric <= 100) return numeric / 10
  return 10
}

export function formatScore(value?: number) {
  const scaled = Math.max(0, Math.min(10, normalizeScore(value)))
  const rounded = Math.round(scaled * 10) / 10
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${display}/10`
}
