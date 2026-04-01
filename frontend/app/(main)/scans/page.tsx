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
  const [activeFilter, setActiveFilter] = useState<ScanType | null>(null)
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
      const matchesType = !activeFilter || getSelectedChecks(scan).includes(activeFilter)
      const matchesKeyword = !keyword || normalizeKeyword(getTaskTitle(scan)).includes(keyword)
      return matchesType && matchesKeyword
    })
  }, [activeFilter, scans, searchTerm])

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
        breadcrumbs={[{ title: '工具链风险分析' }]}
        actions={
          <Link href="/scans/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              新建分析
            </Button>
          </Link>
        }
      />

      <section className="flex flex-col gap-4 rounded-[1.8rem] border border-white/60 bg-white/65 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/35 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <Filter className="h-4 w-4" />
            <span>按检测类型筛选</span>
          </div>

          {(['exposure', 'fuzzing'] as ScanType[]).map((type) => {
            const active = activeFilter === type
            return (
              <Button
                key={type}
                type="button"
                variant={active ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => setActiveFilter((current) => (current === type ? null : type))}
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
            className="pl-11"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '分析任务数', value: summary.total },
          { label: '执行中的风险分析', value: summary.running },
          { label: '已产出风险结果', value: summary.reports },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.8rem]">
            <div className="p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50">{item.value}</p>
            </div>
          </Card>
        ))}
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
                        <p className="font-display text-xl text-slate-950 dark:text-slate-50">{getTaskTitle(scan)}</p>
                        <StatusBadge status={scan.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          当前结果：DOE {scan.summary.exposureFindings} 条，组合式漏洞 {scan.summary.fuzzingFindings} 条。
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href={`/scans/new?copyFrom=${scan.id}`}>
                        <Button variant="ghost" size="icon">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </Link>

                      {canCancel && (
                        <Button variant="ghost" size="icon" onClick={() => setCancelDialog({ open: true, scan })}>
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
            title={activeFilter || searchTerm ? '当前条件下暂无任务' : '暂无任务'}
            description={activeFilter || searchTerm ? '调整筛选条件或搜索关键词后再试。' : '提交一次联合检测后，任务会出现在这里。'}
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
