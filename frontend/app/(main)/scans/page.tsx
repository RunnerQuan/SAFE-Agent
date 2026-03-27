'use client'

import { Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Eye, FileText, Plus, RotateCcw, StopCircle } from 'lucide-react'
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
import { cancelScan, listScans } from '@/lib/api'
import { Scan as ScanType } from '@/lib/types'
import { formatDate, formatDuration, scanTypeLabels, shortId } from '@/lib/utils'

function getTaskTitle(scan: ScanType) {
  return typeof scan.params?.taskName === 'string' ? scan.params.taskName : scan.title || scan.agentName || shortId(scan.id)
}

function getToolCount(scan: ScanType) {
  return typeof scan.params?.toolCount === 'number' ? scan.params.toolCount : 0
}

function getSelectedChecks(scan: ScanType) {
  return Array.isArray(scan.params?.selectedChecks) ? (scan.params.selectedChecks as string[]) : scan.types
}

function ScansContent() {
  const queryClient = useQueryClient()
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; scan: ScanType | null }>({
    open: false,
    scan: null,
  })

  const { data: scans, isLoading, error, refetch } = useQuery({
    queryKey: ['scans'],
    queryFn: () => listScans(),
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.some((scan) => scan.status === 'queued' || scan.status === 'running') ? 3000 : false
    },
  })

  const summary = useMemo(() => {
    const list = scans || []
    return {
      total: list.length,
      running: list.filter((item) => item.status === 'running').length,
      reports: list.filter((item) => item.reportId).length,
    }
  }, [scans])

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      setCancelDialog({ open: false, scan: null })
    },
    onError: () => {
      toast.error('取消失败，请稍后重试')
    },
  })

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="任务"
        description="统一查看工具 metadata 批次任务，追踪双检测执行状态与报告产出。"
        actions={
          <Link href="/scans/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              新建任务
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '总任务数', value: summary.total },
          { label: '进行中', value: summary.running },
          { label: '已生成报告', value: summary.reports },
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
      ) : scans && scans.length > 0 ? (
        <div className="space-y-3">
          {scans.map((scan, index) => {
            const canCancel = scan.status === 'queued' || scan.status === 'running'
            const canOpenReport = scan.status === 'succeeded' && Boolean(scan.reportId)

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
                          <Badge key={type} variant="outline">
                            {scanTypeLabels[type] || type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {canOpenReport && (
                        <Link href={`/reports/${scan.reportId}`}>
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

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
            title="暂无任务"
            description="输入工具 metadata 后，任务会出现在这里。"
            action={{ label: '新建任务', href: '/scans/new' }}
          />
        </Card>
      )}

      <ConfirmDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, scan: cancelDialog.scan })}
        title="取消任务"
        description="确认取消当前任务？"
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
