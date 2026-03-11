'use client'

import { Suspense, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  Bot,
  Clock,
  Eye,
  FileText,
  Plus,
  RotateCcw,
  StopCircle,
} from 'lucide-react'
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

function ScansContent() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agentId')
  const queryClient = useQueryClient()

  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; scan: ScanType | null }>({
    open: false,
    scan: null,
  })

  const { data: scans, isLoading, error, refetch } = useQuery({
    queryKey: ['scans', agentId],
    queryFn: () => listScans(agentId ? { agentId } : undefined),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.some((scan) => scan.status === 'queued' || scan.status === 'running')) {
        return 3000
      }
      return false
    },
  })

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
        title="检测任务"
        description="查看和管理检测执行状态，支持取消、复跑和跳转报告。"
        gradient
        actions={
          <Link href="/scans/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              新建任务
            </Button>
          </Link>
        }
      />

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
                <Card className="glass-card glass-card-hover overflow-hidden border-white/80">
                  {scan.status === 'running' && (
                    <div className="h-px bg-gradient-to-r from-transparent via-[#ff9146]/85 to-transparent" />
                  )}

                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 rounded-lg border border-white/85 bg-white/72 p-2">
                        <Activity className="h-4 w-4 text-[#f27835]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-sm text-slate-900">{shortId(scan.id)}</p>
                          <StatusBadge status={scan.status} />
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            {scan.agentName || 'Unknown Agent'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(scan.createdAt)}
                          </span>
                          {scan.durationMs && <span>耗时 {formatDuration(scan.durationMs)}</span>}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {scan.types.map((type) => (
                            <Badge key={type} variant="outline">
                              {scanTypeLabels[type] || type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {canOpenReport && (
                        <Link href={`/reports/${scan.reportId}`}>
                          <Button variant="ghost" size="icon" className="cursor-pointer">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}

                      <Link href={`/scans/new?agentId=${scan.agentId}&copyFrom=${scan.id}`}>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </Link>

                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => setCancelDialog({ open: true, scan })}
                        >
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
            title="暂无检测任务"
            description="创建任务后可在此追踪执行进度与报告产出。"
            action={{ label: '创建任务', href: '/scans/new' }}
          />
        </Card>
      )}

      <ConfirmDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, scan: cancelDialog.scan })}
        title="取消任务"
        description="确认取消当前检测任务？"
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
