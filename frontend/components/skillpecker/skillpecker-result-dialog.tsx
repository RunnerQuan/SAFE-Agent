'use client'

import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SkillPeckerFinding, SkillPeckerJobDetail, SkillPeckerSkillResult } from '@/lib/skillpecker/types'
import { cn, formatDate } from '@/lib/utils'

interface SkillPeckerResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobDetail?: SkillPeckerJobDetail
  activeSkillName?: string
  onSelectSkill: (skillName: string) => void
  skillResult?: SkillPeckerSkillResult
  isLoading?: boolean
}

const verdictLabelMap: Record<string, string> = {
  malicious: '恶意',
  unsafe: '可疑',
  mixed_risk: '可疑',
  description_unreliable: '可疑',
  insufficient_evidence: '可疑',
  clean_with_reservations: '安全',
  safe: '安全',
}

const decisionLabelMap: Record<string, string> = {
  MALICIOUS: '恶意',
  SUSPICIOUS: '可疑',
  OVERREACH: '越界',
  SAFE: '安全',
}

const flagLabelMap: Record<string, string> = {
  browser_session_or_credentials: '浏览器会话/凭据',
  credential_request: '凭据请求',
  filesystem_access: '文件系统访问',
  shell_or_command_execution: '命令执行',
  persistence_or_external_storage: '持久化/外部存储',
  api_key: 'API Key',
  external_server: '外部服务',
  autonomous_execution: '自主执行',
  driver_or_installer: '驱动/安装器',
  obfuscation_or_evasion: '混淆/规避',
}

const categoryLabelMap: Record<string, string> = {
  description: '描述',
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
  // 常见英文通用类别词
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
  ssrf: 'SSRF 服务器请求伪造',
  csrf: 'CSRF 跨站请求伪造',
  rce: '远程代码执行',
  lfi: '本地文件包含',
  rfi: '远程文件包含',
}

function normalizeLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeVerdictLabel(value?: string) {
  const normalized = normalizeLabel(value).toLowerCase().replace(/\s+/g, '')

  if (!normalized) return ''
  if (normalized === 'malicious') return 'malicious'
  if (normalized === 'unsafe' || normalized === 'suspicious' || normalized === 'insufficientevidence') return 'unsafe'
  if (normalized === 'mixedrisk') return 'mixed_risk'
  if (normalized === 'descriptionunreliable') return 'description_unreliable'
  if (normalized === 'cleanwithreservations' || normalized === 'safe') return 'safe'

  return String(value || '').trim().toLowerCase()
}

function translateLabel(value?: string): string {
  if (!value) return ''
  const raw = String(value).trim()
  if (raw.includes('|')) {
    return raw
      .split('|')
      .map((item) => translateLabel(item))
      .filter(Boolean)
      .join('、')
  }
  // 1. 整体匹配（原始值、小写）
  const mapped = categoryLabelMap[raw] || categoryLabelMap[raw.toLowerCase()]
  if (mapped) return mapped
  // 2. 规范化后整体匹配
  const normalized = normalizeLabel(raw)
  const mappedNorm = categoryLabelMap[normalized] || categoryLabelMap[normalized.toLowerCase()]
  if (mappedNorm) return mappedNorm
  // 3. 逐词翻译：如果所有词都能翻译成中文，则拼中文；否则保留规范化的英文格式
  const parts = normalized.split(' ').filter(Boolean)
  const translated = parts.map((part) => categoryLabelMap[part.toLowerCase()] || null)
  if (translated.every(Boolean)) {
    return translated.join('')
  }
  // 4. 混合翻译（能翻就翻，不能翻保留英文词，首字母大写）
  const mixed = parts.map((part, i) => {
    const t = categoryLabelMap[part.toLowerCase()]
    if (t) return t
    return i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part
  })
  return mixed.join(' ')
}

function isUnknownLike(value?: string) {
  const normalized = normalizeLabel(value).toLowerCase()
  return !normalized || normalized === 'unknown'
}

function translateConfidence(value?: string) {
  const normalized = normalizeLabel(value).toLowerCase()
  if (normalized === 'high') return '高'
  if (normalized === 'medium' || normalized === 'med') return '中'
  if (normalized === 'low') return '低'
  return value || ''
}

function formatDecisionLevel(level?: string) {
  return (level && decisionLabelMap[level]) || level || '待评估'
}

function formatVerdictLabel(label?: string) {
  return (label && verdictLabelMap[label]) || label || '待评估'
}

function verdictBadgeVariant(label?: string): 'high' | 'medium' | 'low' | 'unknown' {
  if (label === 'malicious') return 'high'
  if (label === 'unsafe' || label === 'mixed_risk' || label === 'description_unreliable' || label === 'insufficient_evidence') {
    return 'medium'
  }
  if (label === 'clean_with_reservations' || label === 'safe') return 'low'
  return 'unknown'
}

function decisionBadgeVariant(level?: string): 'high' | 'medium' | 'low' | 'unknown' {
  if (level === 'MALICIOUS') return 'high'
  if (level === 'SUSPICIOUS' || level === 'OVERREACH') return 'medium'
  if (level === 'SAFE') return 'low'
  return 'unknown'
}

function formatScore(value?: number) {
  return `${Math.round(value ?? 0)}/10`
}

function getStatusLabel(status?: string) {
  if (isUnknownLike(status)) return ''
  if (status === 'completed') return '已完成'
  if (status === 'running') return '运行中'
  if (status === 'queued') return '队列中'
  if (status === 'failed') return '失败'
  return status || '未知'
}

function getSeverityLabel(value?: string) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'critical') return '严重'
  if (normalized === 'high') return '高'
  if (normalized === 'med' || normalized === 'medium') return '中'
  if (normalized === 'low') return '低'
  return value || ''
}

function getSeverityClass(value?: string) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'critical') return 'is-critical'
  if (normalized === 'high') return 'is-high'
  if (normalized === 'med' || normalized === 'medium') return 'is-medium'
  if (normalized === 'low') return 'is-low'
  return ''
}

function getConfidenceClass(value?: string) {
  const normalized = normalizeLabel(value).toLowerCase()
  if (normalized === 'high') return 'skillpecker-confidence-chip-high'
  if (normalized === 'medium' || normalized === 'med') return 'skillpecker-confidence-chip-medium'
  if (normalized === 'low') return 'skillpecker-confidence-chip-low'
  return 'skillpecker-detail-chip-neutral'
}


function getEnabledFlags(flags?: Record<string, boolean>): string[] {
  if (!flags) return []
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([key]) => flagLabelMap[key] || translateLabel(key))
}

function getSummaryLine(count: number) {
  return count ? `共有 ${count} 条发现可供审查。` : '当前技能没有可展示的发现。'
}

function FindingCard({ finding, index }: { finding: SkillPeckerFinding; index: number }) {
  const evidenceItems = finding.spans.filter((item) => item.path || item.why)
  const enabledFlags = getEnabledFlags(finding.flags)
  const hasImpact = Boolean(finding.impact && finding.impact !== finding.summary)

  return (
    <article className="skillpecker-finding-card skillpecker-finding-card-refined" style={{ ['--finding-stagger' as string]: `${index * 80}ms` }}>
      <div className="skillpecker-finding-card-head">
        <div className="min-w-0">
          {finding.id ? <p className="skillpecker-finding-kicker">{finding.id}</p> : null}
          <h5>{finding.summary}</h5>
        </div>
        <div className="skillpecker-finding-badges">
          {finding.decisionLevel && !isUnknownLike(finding.decisionLevel) ? (
            <Badge variant={decisionBadgeVariant(finding.decisionLevel)} className="skillpecker-finding-side-badge">
              {formatDecisionLevel(finding.decisionLevel)}
            </Badge>
          ) : null}
          {finding.severity && !isUnknownLike(finding.severity) ? (
            <span className={cn('skillpecker-severity-chip skillpecker-finding-side-badge', getSeverityClass(finding.severity))}>
              {getSeverityLabel(finding.severity)}
            </span>
          ) : null}
          {finding.confidence && !isUnknownLike(finding.confidence) ? (
            <span className={cn('skillpecker-detail-chip skillpecker-finding-side-badge', getConfidenceClass(finding.confidence))}>
              置信度 {translateConfidence(finding.confidence)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="skillpecker-finding-chip-row">
        {finding.scanLevel && !isUnknownLike(finding.scanLevel) ? <span className="skillpecker-detail-chip">扫描层级 {translateLabel(finding.scanLevel)}</span> : null}
        {finding.primaryGroup && !isUnknownLike(finding.primaryGroup) ? <span className="skillpecker-detail-chip">主问题组 {translateLabel(finding.primaryGroup)}</span> : null}
        {finding.sourcePlatform && !isUnknownLike(finding.sourcePlatform) ? <span className="skillpecker-detail-chip">来源 {translateLabel(finding.sourcePlatform)}</span> : null}
        {finding.sourceFile ? <span className="skillpecker-detail-chip">来源文件 {finding.sourceFile}</span> : null}
        {finding.relatedFileCount && !isUnknownLike(finding.relatedFileCount) ? <span className="skillpecker-detail-chip">涉及文件 {finding.relatedFileCount}</span> : null}
        {finding.category && !isUnknownLike(finding.category) ? <span className="skillpecker-detail-chip">类别 {translateLabel(finding.category)}</span> : null}
        {finding.findingClass && !isUnknownLike(finding.findingClass) ? <span className="skillpecker-detail-chip">分类 {translateLabel(finding.findingClass)}</span> : null}
      </div>

      {finding.riskTypes.length ? (
        <div className="skillpecker-finding-chip-row">
          {finding.riskTypes.map((item) => (
            <span key={item} className="skillpecker-detail-chip">
              风险 {translateLabel(item)}
            </span>
          ))}
        </div>
      ) : null}

      {enabledFlags.length ? (
        <div className="skillpecker-finding-chip-row">
          {enabledFlags.map((item) => (
            <span key={item} className="skillpecker-detail-chip skillpecker-detail-chip-warn">
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {hasImpact ? (
        <div className="skillpecker-finding-detail-group">
          <span className="skillpecker-finding-record-label">影响分析</span>
          <p className="skillpecker-finding-detail-copy">{finding.impact}</p>
        </div>
      ) : null}

      {finding.fix ? (
        <div className="skillpecker-finding-detail-group">
          <span className="skillpecker-finding-record-label">处置建议</span>
          <p className="skillpecker-finding-detail-copy">{finding.fix}</p>
        </div>
      ) : null}

      {evidenceItems.length ? (
        <div className="skillpecker-finding-detail-group">
          <span className="skillpecker-finding-record-label">证据</span>
          <div className="skillpecker-evidence-list">
            {evidenceItems.map((span, spanIndex) => (
              <div key={`${span.path || 'evidence'}-${spanIndex}`} className="skillpecker-evidence-row">
                <span className="skillpecker-evidence-path">
                  {span.path || '未提供路径'}
                  {span.start && span.end ? `:${span.start}-${span.end}` : ''}
                </span>
                <p className="skillpecker-evidence-copy">{span.why || '暂无补充说明。'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function SkillPeckerResultDialog({
  open,
  onOpenChange,
  jobDetail,
  activeSkillName,
  onSelectSkill,
  skillResult,
  isLoading = false,
}: SkillPeckerResultDialogProps) {
  const activeSkill = useMemo(() => jobDetail?.skills.find((item) => item.name === activeSkillName), [activeSkillName, jobDetail?.skills])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="skillpecker-result-content-shell w-[min(96vw,92rem)] h-[calc(100dvh-2rem)] max-h-[62rem] max-w-none overflow-hidden border-none bg-transparent p-0 shadow-none"
      >
        <div className="skillpecker-result-dialog glass-panel">
          <div className="skillpecker-result-header">
            <div>
              <p className="skillpecker-result-eyebrow">扫描结果</p>
              <h3 className="mt-2 break-all font-display text-4xl text-slate-950 dark:text-slate-50">{jobDetail?.job.id || '任务结果'}</h3>
            </div>
            <Button variant="outline" className="skillpecker-result-close-button" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>

          <div className="skillpecker-result-workspace">
            <aside className="skillpecker-result-sidebar">
              <div className="skillpecker-result-section-head">
                <h4>技能列表</h4>
                <Badge variant="outline" className="skillpecker-result-count-badge">
                  技能 {jobDetail?.skills.length ?? 0}
                </Badge>
              </div>

              {jobDetail ? (
                <div className="skillpecker-result-skill-list">
                  {jobDetail.skills.length ? (
                    jobDetail.skills.map((skill, index) => (
                      <button
                        key={skill.name}
                        type="button"
                        className={cn('skillpecker-result-skill-card skillpecker-result-skill-card-refined', activeSkillName === skill.name && 'is-active')}
                        style={{ ['--skill-stagger' as string]: `${index * 70}ms` }}
                        onClick={() => onSelectSkill(skill.name)}
                      >
                        <div className="skillpecker-result-skill-card-top">
                          <div className="min-w-0">
                            <p className="tree-node-kicker">技能</p>
                            <p className="skillpecker-result-skill-name">{skill.name}</p>
                            <p className="skillpecker-result-skill-subtitle">
                              {skill.status === 'failed'
                                ? skill.errorMessage || '结果读取失败'
                                : `${skill.artifactCount} 个制品 · ${skill.ruleHitCount} 条规则命中`}
                            </p>
                          </div>
                          <div className="skillpecker-result-skill-side">
                            {skill.verdictLabel && !isUnknownLike(skill.verdictLabel) ? (
                              <Badge variant={verdictBadgeVariant(normalizeVerdictLabel(skill.verdictLabel))}>
                                {formatVerdictLabel(normalizeVerdictLabel(skill.verdictLabel))}
                              </Badge>
                            ) : null}
                            <span className={cn('skillpecker-result-expand-indicator', activeSkillName === skill.name && 'is-expanded')}>
                              <span>{activeSkillName === skill.name ? '已选中' : '查看发现'}</span>
                              <span aria-hidden="true">⌄</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="skillpecker-result-empty">当前任务尚未产出可查看的技能结果。</div>
                  )}
                </div>
              ) : (
                <div className="skillpecker-result-empty">正在读取任务详情…</div>
              )}
            </aside>

            <section className="skillpecker-result-detail">
              {isLoading ? (
                <div className="skillpecker-result-empty">正在加载技能详情…</div>
              ) : skillResult ? (
                <div className="skillpecker-result-detail-scroll">
                  <div className="skillpecker-result-section-head">
                    <h4>扫描结果</h4>
                    <span className="skillpecker-result-skill-anchor">{skillResult.skillName}</span>
                  </div>

                  {skillResult.status === 'error' ? (
                    <div className="skillpecker-result-error-card">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-500" />
                        <div>
                          <p className="font-semibold text-rose-700 dark:text-rose-300">技能结果读取失败</p>
                          <p className="mt-2 text-base leading-8 text-rose-700/85 dark:text-rose-200/85">
                            {skillResult.errorMessage || '后端未返回详细错误信息。'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="skillpecker-skill-detail-card">
                      <div className="skillpecker-skill-detail-top">
                        <div className="min-w-0">
                          <p className="tree-node-kicker">技能发现</p>
                          <h5>{skillResult.skillName}</h5>
                          <p className="skillpecker-result-summary-english">{getSummaryLine(skillResult.findings.length)}</p>
                        </div>
                        <div className="skillpecker-skill-detail-side">
                          <div className="skillpecker-score-line">
                            <span className="metric-chip">恶意度 {formatScore(skillResult.scorecard?.maliciousness)}</span>
                            <span className="metric-chip">安全度 {formatScore(skillResult.scorecard?.safety)}</span>
                            <span className="metric-chip">描述可靠性 {formatScore(skillResult.scorecard?.descriptionReliability)}</span>
                            <span className="metric-chip">覆盖度 {formatScore(skillResult.scorecard?.coverage)}</span>
                          </div>
                          <div className="skillpecker-result-side-badges">
                            {skillResult.verdictLabel && !isUnknownLike(skillResult.verdictLabel) ? (
                              <Badge variant={verdictBadgeVariant(normalizeVerdictLabel(skillResult.verdictLabel))}>
                                {formatVerdictLabel(normalizeVerdictLabel(skillResult.verdictLabel))}
                              </Badge>
                            ) : null}
                            {activeSkill?.decisionLevel && !isUnknownLike(activeSkill.decisionLevel) ? (
                              <Badge variant={decisionBadgeVariant(activeSkill.decisionLevel)}>{formatDecisionLevel(activeSkill.decisionLevel)}</Badge>
                            ) : null}
                            {activeSkill && !isUnknownLike(activeSkill.status) ? (
                              <Badge variant={activeSkill.status === 'completed' ? 'succeeded' : activeSkill.status}>
                                {getStatusLabel(activeSkill.status)}
                              </Badge>
                            ) : null}
                          </div>
                          {jobDetail?.job.createdAt ? (
                            <span className="skillpecker-result-time">{formatDate(jobDetail.job.createdAt)}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="skillpecker-finding-list">
                        {skillResult.findings.length ? (
                          skillResult.findings.map((finding, index) => <FindingCard key={`${finding.summary}-${index}`} finding={finding} index={index} />)
                        ) : (
                          <div className="skillpecker-result-empty">当前技能没有命中的规则发现。</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="skillpecker-result-empty">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">选择一个技能查看扫描详情</p>
                  <p className="mt-2 max-w-md text-base leading-8 text-slate-500 dark:text-slate-400">
                    这里会展示判定结果、风险评分、问题证据与处置建议。
                  </p>
                  {jobDetail?.skills[0] ? (
                    <Button className="mt-5" variant="outline" onClick={() => onSelectSkill(jobDetail.skills[0].name)}>
                      打开第一个技能
                    </Button>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
