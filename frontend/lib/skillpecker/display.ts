import { SkillPeckerFinding, SkillPeckerJobDetail, SkillPeckerSkillResult } from '@/lib/skillpecker/types'

const localizedCategoryMap: Record<string, { zh: string }> = {
  academic: { zh: '学术' },
  ai_engineering: { zh: 'AI 工程' },
  architecture_patterns: { zh: '架构模式' },
  astronomy_physics: { zh: '天文物理' },
  automation_tools: { zh: '自动化工具' },
  backend: { zh: '后端' },
  bioinformatics: { zh: '生物信息' },
  blockchain: { zh: '区块链' },
  business: { zh: '商业' },
  business_apps: { zh: '商业应用' },
  cicd: { zh: 'CI/CD' },
  cli_tools: { zh: 'CLI 工具' },
  cms_platforms: { zh: 'CMS 平台' },
  code_quality: { zh: '代码质量' },
  computational_chemistry: { zh: '计算化学' },
  content_media: { zh: '内容媒体' },
  data_ai: { zh: '数据智能' },
  databases: { zh: '数据库' },
  debugging: { zh: '调试' },
  design: { zh: '设计' },
  development: { zh: '开发' },
  devops: { zh: '运维' },
  documentation: { zh: '文档' },
  documents: { zh: '文档处理' },
  domain_utilities: { zh: '域名工具' },
  ecommerce: { zh: '电商' },
  ecommerce_development: { zh: '电商开发' },
  education: { zh: '教育' },
  examples: { zh: '示例' },
  finance_investment: { zh: '金融投资' },
  fixtures: { zh: '样例数据' },
  framework_internals: { zh: '框架内部' },
  frontend: { zh: '前端' },
  gaming: { zh: '游戏' },
  health_fitness: { zh: '健康健身' },
  ide_plugins: { zh: 'IDE 插件' },
  knowledge_base: { zh: '知识库' },
  lab_tools: { zh: '实验工具' },
  lifestyle: { zh: '生活方式' },
  literature_writing: { zh: '文学写作' },
  llm_ai: { zh: '大模型/AI' },
  media: { zh: '媒体' },
  mobile: { zh: '移动端' },
  monitoring: { zh: '监控' },
  other: { zh: '其他' },
  package_distribution: { zh: '包分发' },
  productivity_tools: { zh: '生产力工具' },
  project_management: { zh: '项目管理' },
  research: { zh: '研究' },
  sales_marketing: { zh: '销售营销' },
  scientific_computing: { zh: '科学计算' },
  scripting: { zh: '脚本' },
  shelby: { zh: 'Shelby' },
  skills: { zh: '技能' },
  skills_index: { zh: '技能索引' },
  smart_contracts: { zh: '智能合约' },
  stack_evaluation: { zh: '技术栈评估' },
  technical_docs: { zh: '技术文档' },
  test_fixtures: { zh: '测试样例' },
  testing: { zh: '测试' },
  testing_security: { zh: '测试安全' },
  tools: { zh: '工具' },
  news: { zh: '新闻' },
  unknown: { zh: '未知' },
  malicious: { zh: '恶意' },
  unsafe: { zh: '不安全' },
  description: { zh: '描述不可靠' },
  active_malice: { zh: '明确恶意行为' },
  collection_of_web_shells: { zh: 'Web Shell 收集' },
  installation: { zh: '安装' },
  authentication: { zh: '认证' },
  permission: { zh: '权限' },
  privacy: { zh: '隐私' },
  network: { zh: '网络' },
  execution: { zh: '执行' },
  shell: { zh: 'Shell 执行' },
  marketplace: { zh: '应用市场' },
  clawhub: { zh: 'Clawhub 平台' },
  permission_overreach: { zh: '权限越界' },
  wellness_health: { zh: '健康' },
  permission_overreach_action: { zh: '权限越界操作' },
  access_boundary_risk: { zh: '访问边界风险' },
  data_exfiltration: { zh: '数据外传' },
  security_risk: { zh: '安全风险' },
  privilege_escalation: { zh: '权限提升' },
  execution_system_risk: { zh: '执行系统风险' },
  data_over_collection: { zh: '数据过度收集' },
  data_governance_risk: { zh: '数据治理风险' },
  privacy_violation: { zh: '隐私违规' },
  trojan_downloader: { zh: '木马下载/投毒' },
  reverse_shell: { zh: '反连/远控' },
  evasion_technique: { zh: '规避与混淆' },
  capability_gap: { zh: '能力缺口' },
  credential_handling: { zh: '凭证处理' },
  credential_theft: { zh: '凭证窃取' },
  input_validation: { zh: '输入校验' },
  insecure_credential_storage: { zh: '不安全凭证存储' },
  insecure_installation: { zh: '不安全安装' },
  misleading_authentication: { zh: '误导性认证' },
  missing_executable_code: { zh: '缺少可执行实现' },
  subprocess: { zh: '子进程执行' },
  supply_chain: { zh: '供应链' },
  supply_chain_attack: { zh: '供应链攻击' },
  metadata: { zh: '元数据' },
  summary: { zh: '摘要' },
  browser_automation: { zh: '浏览器自动化' },
  browser_session_or_credentials: { zh: '浏览器会话或凭证' },
  remote_command_execution: { zh: '远程命令执行' },
  external_communication: { zh: '外部通信' },
  obfuscated_execution: { zh: '混淆执行' },
  filesystem_access: { zh: '文件系统访问' },
  credential_access: { zh: '凭据访问' },
  credential_request: { zh: '凭据请求' },
  env_access: { zh: '环境变量访问' },
  secret_access: { zh: '敏感信息访问' },
  path_traversal: { zh: '路径穿越' },
  command_execution: { zh: '命令执行' },
  command_line: { zh: '命令行' },
  technical_docs_scan: { zh: '技术文档扫描' },
}

const localizedFlagMap: Record<string, { zh: string }> = {
  permission_overreach: { zh: '权限越界' },
  data_over_collection: { zh: '数据过度收集' },
  privilege_escalation: { zh: '权限提升' },
  privacy_violation: { zh: '隐私违规' },
  data_exfiltration: { zh: '数据外传' },
  trojan_downloader: { zh: '木马下载/投毒' },
  reverse_shell: { zh: '反连/远控' },
  evasion_technique: { zh: '规避与混淆' },
  supply_chain_attack: { zh: '供应链攻击' },
  browser_session_or_credentials: { zh: '浏览器会话或凭证' },
  filesystem_access: { zh: '文件系统访问' },
  credential_request: { zh: '凭证请求' },
  api_key: { zh: 'API 密钥' },
  autonomous_execution: { zh: '自主执行' },
  driver_or_installer: { zh: '驱动或安装器' },
  external_server: { zh: '外部服务器' },
  obfuscation_or_evasion: { zh: '混淆或规避' },
  persistence_or_external_storage: { zh: '持久化或外部存储' },
  shell_or_command_execution: { zh: 'Shell 或命令执行' },
}

const localizedScanLevelMap: Record<string, { zh: string }> = {
  script_scan: { zh: '脚本扫描' },
  description_scan: { zh: '描述扫描' },
}

const localizedDecisionLevelMap: Record<string, { en: string; zh: string }> = {
  SAFE: { en: 'SAFE', zh: '安全' },
  SUSPICIOUS: { en: 'SUSPICIOUS', zh: '可疑型' },
  MALICIOUS: { en: 'MALICIOUS', zh: '恶意型' },
  OVERREACH: { en: 'OVERREACH', zh: '越界型' },
  UNKNOWN: { en: 'UNKNOWN', zh: '未知' },
}

const localizedMarkdownFieldMap: Record<string, { zh: string }> = {
  name: { zh: '名称' },
  description: { zh: '描述' },
  category: { zh: '分类' },
  tags: { zh: '标签' },
  version: { zh: '版本' },
  author: { zh: '作者' },
}

const phraseAliasMap: Record<string, string> = {
  'active malice': 'active_malice',
  'access boundary risk': 'access_boundary_risk',
  'data governance risk': 'data_governance_risk',
  'execution / system risk': 'execution_system_risk',
  'description scan': 'description_scan',
  'script scan': 'script_scan',
  'input validation': 'input_validation',
  'path traversal': 'path_traversal',
  'permission overreach': 'permission_overreach',
  'permission overreach action': 'permission_overreach_action',
  'permission overreach (action)': 'permission_overreach_action',
  'privacy violation': 'privacy_violation',
  'data exfiltration': 'data_exfiltration',
  'data over collection': 'data_over_collection',
  'data over-collection': 'data_over_collection',
  'security risk': 'security_risk',
  'privilege escalation': 'privilege_escalation',
  'supply chain': 'supply_chain',
  'supply chain attack': 'supply_chain_attack',
  'reverse shell': 'reverse_shell',
  'trojan downloader': 'trojan_downloader',
  'evasion technique': 'evasion_technique',
  'collection of web shells': 'collection_of_web_shells',
  'remote command execution': 'remote_command_execution',
  'shell or command execution': 'shell_or_command_execution',
  'browser session or credentials': 'browser_session_or_credentials',
}

const tokenMap: Record<string, string> = {
  input: '输入',
  validation: '校验',
  subprocess: '子进程执行',
  path: '路径',
  traversal: '穿越',
  command: '命令',
  line: '行',
  file: '文件',
  files: '文件',
  system: '系统',
  risk: '风险',
  security: '安全',
  privacy: '隐私',
  supply: '供应',
  chain: '链',
  reverse: '反连',
  shell: 'Shell',
  credential: '凭证',
  credentials: '凭证',
  browser: '浏览器',
  session: '会话',
  scan: '扫描',
  description: '描述',
  script: '脚本',
  execution: '执行',
  installation: '安装',
  authentication: '认证',
  network: '网络',
  permission: '权限',
  overreach: '越界',
  over: '过度',
  collection: '收集',
  data: '数据',
  governance: '治理',
  access: '访问',
  boundary: '边界',
  privilege: '权限',
  escalation: '提升',
  evasion: '规避',
  technique: '混淆',
  supplychain: '供应链',
}

function normalizeLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function keyify(value?: string) {
  return normalizeLabel(value).toLowerCase().replace(/\s+/g, '_')
}

function translateTokenizedLabel(value: string) {
  return value
    .split(' ')
    .map((part) => tokenMap[part.toLowerCase()] || part)
    .join('')
}

function lookupLocalizedZh(value?: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const normalized = normalizeLabel(raw)
  const lower = normalized.toLowerCase()
  const underscored = keyify(raw)
  const alias = phraseAliasMap[lower]

  const sources: Array<Record<string, { zh: string }>> = [
    localizedCategoryMap,
    localizedFlagMap,
    localizedScanLevelMap,
    localizedMarkdownFieldMap,
  ]

  for (const source of sources) {
    const entry = source[raw] || source[raw.toLowerCase()] || source[underscored] || (alias ? source[alias] : undefined)
    if (entry?.zh) {
      return entry.zh
    }
  }

  const decision =
    localizedDecisionLevelMap[raw] ||
    localizedDecisionLevelMap[raw.toUpperCase()] ||
    (alias ? localizedDecisionLevelMap[alias.toUpperCase()] : undefined)
  if (decision?.zh) {
    return decision.zh
  }

  return ''
}

export function isUnknownLike(value?: string) {
  const normalized = normalizeLabel(value).toLowerCase()
  return !normalized || normalized === 'unknown' || normalized === 'n/a' || normalized === 'none'
}

function normalizeVerdictLabel(value?: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

  if (!normalized) return undefined
  if (normalized === 'malicious') return 'malicious'
  if (normalized === 'unsafe' || normalized === 'suspicious') return 'unsafe'
  if (normalized === 'mixedrisk') return 'mixed_risk'
  if (normalized === 'descriptionunreliable') return 'description_unreliable'
  if (normalized === 'insufficientevidence') return 'insufficient_evidence'
  if (normalized === 'cleanwithreservations') return 'clean_with_reservations'
  if (normalized === 'safe') return 'safe'

  return typeof value === 'string' ? value : undefined
}

export function translateSkillPeckerLabel(value?: string): string {
  if (!value) return ''

  const raw = String(value).trim()
  if (raw.includes('|')) {
    return raw
      .split('|')
      .map((item) => translateSkillPeckerLabel(item))
      .filter(Boolean)
      .join('、')
  }

  if (isUnknownLike(raw)) {
    return ''
  }

  const direct = lookupLocalizedZh(raw)
  if (direct) {
    return direct
  }

  const normalized = normalizeLabel(raw)
  const tokenized = translateTokenizedLabel(normalized)
  return tokenized === normalized ? normalized : tokenized
}

function translateFinding(finding: SkillPeckerFinding): SkillPeckerFinding {
  return {
    ...finding,
    category: translateSkillPeckerLabel(finding.category) || undefined,
    findingClass: translateSkillPeckerLabel(finding.findingClass) || undefined,
    primaryGroup: translateSkillPeckerLabel(finding.primaryGroup) || undefined,
    sourcePlatform: translateSkillPeckerLabel(finding.sourcePlatform) || undefined,
    scanLevel: translateSkillPeckerLabel(finding.scanLevel) || undefined,
    riskTypes: finding.riskTypes.map((item) => translateSkillPeckerLabel(item)).filter(Boolean),
    flags: Object.fromEntries(
      Object.entries(finding.flags).map(([key, enabled]) => [translateSkillPeckerLabel(key) || key, enabled])
    ),
  }
}

export function translateSkillPeckerJobDetail(detail: SkillPeckerJobDetail): SkillPeckerJobDetail {
  return {
    ...detail,
    skills: detail.skills.map((skill) => ({
      ...skill,
      primaryConcern: translateSkillPeckerLabel(skill.primaryConcern) || skill.primaryConcern,
      verdictLabel: normalizeVerdictLabel(skill.verdictLabel),
    })),
  }
}

export function translateSkillPeckerSkillResult(result: SkillPeckerSkillResult): SkillPeckerSkillResult {
  return {
    ...result,
    verdictLabel: normalizeVerdictLabel(result.verdictLabel),
    primaryConcern: translateSkillPeckerLabel(result.primaryConcern) || result.primaryConcern,
    findings: result.findings.map(translateFinding),
  }
}
