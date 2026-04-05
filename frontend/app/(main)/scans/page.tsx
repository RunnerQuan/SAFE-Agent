'use client'

import { Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Eye, Filter, Plus, RotateCcw, Search, StopCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/badges/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cancelScan, listScans } from '@/lib/api'
import { Scan, ScanType } from '@/lib/types'
import { formatDate, formatDuration, scanTypeLabels, shortId } from '@/lib/utils'
import { Activity, BarChart3, FileSearch, GitBranch, Network, Shield, ShieldAlert, Workflow } from 'lucide-react'

function getTaskTitle(scan: Scan) {
  return typeof scan.params?.taskName === 'string' ? scan.params.taskName : scan.title || scan.agentName || shortId(scan.id)
}

function getToolCount(scan: Scan) {
  return typeof scan.params?.toolCount === 'number' ? scan.params.toolCount : 0
}

function getSelectedChecks(scan: Scan) {
  return Array.isArray(scan.params?.selectedChecks) ? (scan.params.selectedChecks as string[]) : scan.types
}

function hasReadableResult(scan: Scan) {
  return Boolean(scan.detail) || scan.status === 'succeeded' || scan.status === 'partial'
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase()
}

function ScansContent() {
  const queryClient = useQueryClient()
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; scan: Scan | null }>({
    open: false,
    scan: null,
  })
  const [activeFilters, setActiveFilters] = useState<ScanType[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const { data: scans, isLoading, error, refetch } = useQuery({
    queryKey: ['scans'],
    queryFn: () => listScans(),
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.some((scan) => scan.status === 'queued' || scan.status === 'running') ? 3000 : false
    },
  })

  const filteredScans = useMemo(() => {
    const list = scans || []
    const keyword = normalizeKeyword(searchTerm)

    return list.filter((scan) => {
      const selectedChecks = getSelectedChecks(scan)
      const matchesType = activeFilters.length === 0 || activeFilters.every(filter => selectedChecks.includes(filter))
      const matchesKeyword = !keyword || normalizeKeyword(getTaskTitle(scan)).includes(keyword)
      return matchesType && matchesKeyword
    })
  }, [activeFilters, scans, searchTerm])

  const summary = useMemo(() => {
    const list = filteredScans
    return {
      total: list.length,
      running: list.filter((item) => item.status === 'running' || item.status === 'queued').length,
      reports: list.filter((item) => hasReadableResult(item)).length,
    }
  }, [filteredScans])

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消。')
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      setCancelDialog({ open: false, scan: null })
    },
    onError: () => {
      toast.error('取消失败，请稍后重试。')
    },
  })

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="工具链风险分析"
        description="统一查看工具链联合检测任务，跟踪执行进度，并在详情页直接阅读 DOE 与组合式漏洞结果。"
        descriptionClassName="page-header-description-lg"
        actions={
          <Link href="/scans/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              新建分析
            </Button>
          </Link>
        }
      />

      {/* 工具能力介绍 — 紧跟 PageHeader */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* agentRaft — 数据过度暴露检测 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="scan-tool-card rounded-[1.8rem] p-0 overflow-hidden">
            <div className="scan-tool-card-header scan-tool-card-header-warm">
              <div className="scan-tool-icon scan-tool-icon-warm">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <p className="scan-tool-eyebrow">agentRaft · DOE 检测</p>
                <h3 className="scan-tool-title">数据过度暴露检测</h3>
              </div>
            </div>
            <div className="scan-tool-body">
              <p className="scan-tool-desc">
                溯源智能体调用链，识别超出必要范围的敏感数据返回，依据 GDPR / CCPA / PIPL 标注数据最小化违反情形。
              </p>
              <div className="scan-tool-features">
                <div className="scan-tool-feature">
                  <GitBranch className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>调用链逐步审计 · D_int / D_nec / D_OE 字段分离</span>
                </div>
                <div className="scan-tool-feature">
                  <Workflow className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>多 LLM 投票（DeepSeek · GPT-4.1 · Qwen）</span>
                </div>
              </div>
              <div className="scan-tool-tags">
                <Badge variant="outline" className="scan-tool-tag">GDPR</Badge>
                <Badge variant="outline" className="scan-tool-tag">CCPA</Badge>
                <Badge variant="outline" className="scan-tool-tag">PIPL</Badge>
                <Badge variant="medium" className="scan-tool-tag">数据过度暴露</Badge>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* MTAtlas — 组合式漏洞检测 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="scan-tool-card rounded-[1.8rem] p-0 overflow-hidden">
            <div className="scan-tool-card-header scan-tool-card-header-cool">
              <div className="scan-tool-icon scan-tool-icon-cool">
                <Network className="h-6 w-6" />
              </div>
              <div>
                <p className="scan-tool-eyebrow">MTAtlas · 静态分析</p>
                <h3 className="scan-tool-title">组合式漏洞检测</h3>
              </div>
            </div>
            <div className="scan-tool-body">
              <p className="scan-tool-desc">
                静态构建工具依赖图，自动发现跨 MCP 高风险调用链路，输出 Source / Sink 风险分类报告。
              </p>
              <div className="scan-tool-features">
                <div className="scan-tool-feature">
                  <FileSearch className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>依赖边提取 · Sink 识别 · 候选链语义过滤</span>
                </div>
                <div className="scan-tool-feature">
                  <BarChart3 className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>输出 report.md · source_risk_report · summary</span>
                </div>
              </div>
              <div className="scan-tool-tags">
                <Badge variant="outline" className="scan-tool-tag">static-pure</Badge>
                <Badge variant="outline" className="scan-tool-tag">跨 MCP</Badge>
                <Badge variant="running" className="scan-tool-tag">组合式漏洞</Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section className="flex flex-col gap-4 rounded-[1.8rem] border border-white/60 bg-white/65 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/35 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 scan-filter-text">
            <Filter className="h-4 w-4" />
            <span>按检测类型筛选</span>
          </div>

          {(['exposure', 'fuzzing'] as ScanType[]).map((type) => {
            const active = activeFilters.includes(type)
            return (
              <Button
                key={type}
                type="button"
                variant={active ? 'default' : 'outline'}
                className="rounded-full scan-filter-btn"
                onClick={() => setActiveFilters((current) => 
                  current.includes(type) 
                    ? current.filter(t => t !== type)
                    : [...current, type]
                )}
              >
                {scanTypeLabels[type]}
              </Button>
            )
          })}
        </div>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索任务名称"
            className="pl-11 scan-filter-input"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: '分析任务数',
            value: summary.total,
            icon: BarChart3,
            tone: 'blue' as const,
            accent: 'rgba(56,189,248,0.12)',
          },
          {
            label: '执行中的风险分析',
            value: summary.running,
            icon: Activity,
            tone: 'amber' as const,
            accent: 'rgba(251,146,60,0.12)',
          },
          {
            label: '已产出风险结果',
            value: summary.reports,
            icon: Shield,
            tone: 'green' as const,
            accent: 'rgba(52,211,153,0.12)',
          },
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="scan-stat-card relative overflow-hidden rounded-[1.8rem]">
                {/* 背景光晕 */}
                <div className="scan-stat-glow" style={{ background: `radial-gradient(ellipse at top right, ${item.accent}, transparent 60%)` }} />
                <div className="relative z-10 flex items-start justify-between p-6">
                  <div>
                    <p className="scan-stat-label">{item.label}</p>
                    <p className="scan-stat-value mt-2 font-display">{item.value}</p>
                  </div>
                  <div className={`scan-stat-icon scan-stat-icon-${item.tone}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
                {/* 底部装饰线 */}
                <div className={`scan-stat-bar scan-stat-bar-${item.tone}`} />
              </Card>
            </motion.div>
          )
        })}
      </section>

      {isLoading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : filteredScans.length > 0 ? (
        <div className="space-y-3">
          {filteredScans.map((scan, index) => {
            const canCancel = scan.status === 'queued' || scan.status === 'running'

            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="rounded-[1.8rem]">
                  <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="scan-list-title font-display text-slate-950 dark:text-slate-50">{getTaskTitle(scan)}</p>
                        <StatusBadge status={scan.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 scan-list-meta text-slate-500 dark:text-slate-400">
                        <span>{shortId(scan.id)}</span>
                        <span>{getToolCount(scan)} 个工具</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(scan.createdAt)}
                        </span>
                        {scan.durationMs && <span>耗时 {formatDuration(scan.durationMs)}</span>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getSelectedChecks(scan).map((type) => (
                          <Badge key={type} variant={type === 'exposure' ? 'medium' : 'running'}>
                            {scanTypeLabels[type] || type}
                          </Badge>
                        ))}
                      </div>

                      {scan.summary && (
                        <p className="scan-list-summary text-slate-500 dark:text-slate-400">
                          当前结果：DOE {scan.summary.exposureFindings} 条，组合式漏洞 {scan.summary.fuzzingFindings} 条。
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="ghost" size="icon" title="查看详情">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href={`/scans/new?copyFrom=${scan.id}`}>
                        <Button variant="ghost" size="icon" title="重新运行">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </Link>

                      {canCancel && (
                        <Button variant="ghost" size="icon" title="取消任务" onClick={() => setCancelDialog({ open: true, scan })}>
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card className="glass-card">
          <EmptyState
            title={activeFilters.length > 0 || searchTerm ? '当前条件下暂无任务' : '暂无任务'}
            description={activeFilters.length > 0 || searchTerm ? '调整筛选条件或搜索关键词后再试。' : '提交一次联合检测后，任务会出现在这里。'}
            action={{ label: '新建分析', href: '/scans/new' }}
          />
        </Card>
      )}

      <ConfirmDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, scan: cancelDialog.scan })}
        title="取消任务"
        description="确认取消当前联合检测任务吗？"
        confirmLabel="确认取消"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelDialog.scan) {
            cancelMutation.mutate(cancelDialog.scan.id)
          }
        }}
      />
    </div>
  )
}

export default function ScansPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="table" count={5} />}>
      <ScansContent />
    </Suspense>
  )
}
