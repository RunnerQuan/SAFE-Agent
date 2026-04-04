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
  shell_or_command_execution: 'Shell/命令执行',
  persistence_or_external_storage: '持久化/外部存储',
  api_key: 'API Key',
  external_server: '外部服务',
  autonomous_execution: '自主执行',
  driver_or_installer: '驱动/安装器',
  obfuscation_or_evasion: '混淆/规避',
}

function humanizeLabel(value?: string) {
  if (!value) {
    return ''
  }

  return value
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

function getEnabledFlags(flags: Record<string, boolean>) {
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([key]) => flagLabelMap[key] || humanizeLabel(key))
}

function FindingCard({ finding, index }: { finding: SkillPeckerFinding; index: number }) {
  const evidenceItems = finding.spans.filter((item) => item.path || item.why)
  const enabledFlags = getEnabledFlags(finding.flags)
  const hasImpact = Boolean(finding.impact && finding.impact !== finding.summary)

  return (
    <article className="skillpecker-finding-card" style={{ ['--finding-stagger' as string]: `${index * 80}ms` }}>
      <div className="skillpecker-finding-card-head">
        <div className="min-w-0">
          {finding.id ? <p className="skillpecker-finding-kicker">{finding.id}</p> : null}
          <h5>{finding.summary}</h5>
        </div>
        <div className="skillpecker-finding-badges">
          {finding.decisionLevel ? (
            <Badge variant={decisionBadgeVariant(finding.decisionLevel)}>{formatDecisionLevel(finding.decisionLevel)}</Badge>
          ) : null}
          {finding.severity ? <span className={cn('skillpecker-severity-chip', getSeverityClass(finding.severity))}>{getSeverityLabel(finding.severity)}</span> : null}
          {finding.confidence ? <span className="skillpecker-detail-chip skillpecker-detail-chip-neutral">置信度 {finding.confidence}</span> : null}
        </div>
      </div>

      <div className="skillpecker-finding-chip-row">
        {finding.scanLevel ? <span className="skillpecker-detail-chip">扫描层级 {humanizeLabel(finding.scanLevel)}</span> : null}
        {finding.primaryGroup ? <span className="skillpecker-detail-chip">主问题组 {humanizeLabel(finding.primaryGroup)}</span> : null}
        {finding.sourcePlatform ? <span className="skillpecker-detail-chip">来源 {humanizeLabel(finding.sourcePlatform)}</span> : null}
        {finding.sourceFile ? <span className="skillpecker-detail-chip">来源文件 {finding.sourceFile}</span> : null}
        {finding.relatedFileCount ? <span className="skillpecker-detail-chip">涉及文件 {finding.relatedFileCount}</span> : null}
        {finding.category ? <span className="skillpecker-detail-chip">类别 {humanizeLabel(finding.category)}</span> : null}
        {finding.findingClass ? <span className="skillpecker-detail-chip">分类 {humanizeLabel(finding.findingClass)}</span> : null}
      </div>

      {finding.riskTypes.length ? (
        <div className="skillpecker-finding-chip-row">
          {finding.riskTypes.map((item) => (
            <span key={item} className="skillpecker-detail-chip">
              风险 {humanizeLabel(item)}
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
      <DialogContent className="w-[min(96vw,92rem)] max-w-none overflow-hidden border-none bg-transparent p-0 shadow-none">
        <div className="skillpecker-result-dialog glass-panel">
          <div className="skillpecker-result-header">
            <div>
              <p className="text-sm font-semibold tracking-[0.1em] text-sky-600">扫描结果</p>
              <h3 className="mt-2 break-all font-display text-4xl text-slate-950 dark:text-slate-50">
                {jobDetail?.job.id || '任务结果'}
              </h3>
            </div>
            <Button variant="outline" className="rounded-full px-6" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>

          <div className="skillpecker-result-workspace">
            <aside className="skillpecker-result-sidebar">
              <div className="skillpecker-result-section-head">
                <h4>技能列表</h4>
                <Badge variant="outline">技能 {jobDetail?.skills.length ?? 0}</Badge>
              </div>

              {jobDetail ? (
                <div className="skillpecker-result-skill-list">
                  {jobDetail.skills.length ? (
                    jobDetail.skills.map((skill, index) => (
                      <button
                        key={skill.name}
                        type="button"
                        className={cn('skillpecker-result-skill-card', activeSkillName === skill.name && 'is-active')}
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
                            {skill.status === 'failed' ? (
                              <Badge variant="failed">失败</Badge>
                            ) : skill.verdictLabel ? (
                              <Badge variant={verdictBadgeVariant(skill.verdictLabel)}>{formatVerdictLabel(skill.verdictLabel)}</Badge>
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
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{skillResult.skillName}</span>
                  </div>

                  {skillResult.status === 'error' ? (
                    <div className="skillpecker-result-error-card">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-500" />
                        <div>
                          <p className="font-medium text-rose-700 dark:text-rose-300">技能结果读取失败</p>
                          <p className="mt-2 text-sm leading-7 text-rose-700/85 dark:text-rose-200/85">
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
                          <p className="tree-node-subtitle">
                            {skillResult.findings.length ? `共有 ${skillResult.findings.length} 条发现可供审查。` : '当前技能没有可展示的问题发现。'}
                          </p>
                        </div>
                        <div className="skillpecker-skill-detail-side">
                          <Badge variant={verdictBadgeVariant(skillResult.verdictLabel)}>{formatVerdictLabel(skillResult.verdictLabel)}</Badge>
                          <div className="skillpecker-score-line">
                            <span className="metric-chip">恶意度 {formatScore(skillResult.scorecard?.maliciousness)}</span>
                            <span className="metric-chip">安全度 {formatScore(skillResult.scorecard?.safety)}</span>
                            <span className="metric-chip">描述可靠性 {formatScore(skillResult.scorecard?.descriptionReliability)}</span>
                            <span className="metric-chip">覆盖度 {formatScore(skillResult.scorecard?.coverage)}</span>
                          </div>
                          {activeSkill?.decisionLevel ? (
                            <Badge variant={decisionBadgeVariant(activeSkill.decisionLevel)}>{formatDecisionLevel(activeSkill.decisionLevel)}</Badge>
                          ) : null}
                          {activeSkill ? (
                            <Badge variant={activeSkill.status === 'completed' ? 'succeeded' : activeSkill.status}>
                              {getStatusLabel(activeSkill.status)}
                            </Badge>
                          ) : null}
                          {jobDetail?.job.createdAt ? (
                            <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(jobDetail.job.createdAt)}</span>
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
                  <p className="font-medium text-slate-900 dark:text-slate-50">选择一个 Skill 查看扫描详情</p>
                  <p className="mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                    这里会展示裁决结果、风险分数、问题证据与处置建议。
                  </p>
                  {jobDetail?.skills[0] ? (
                    <Button className="mt-5" variant="outline" onClick={() => onSelectSkill(jobDetail.skills[0].name)}>
                      打开第一个 Skill
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
