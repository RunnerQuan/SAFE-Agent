'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, RotateCcw, StopCircle, ArrowLeft, Info, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge } from '@/components/badges/status-badge'
import { KeyValueGrid } from '@/components/common/key-value-grid'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { getScan, getScanLogs, cancelScan } from '@/lib/api'
import { formatDate, formatDuration, shortId, stageLabels, scanTypeLabels } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LogEntry } from '@/lib/types'

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const scanId = params.id as string
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all')

  const isTerminal = (status?: string) =>
    status === 'succeeded' || status === 'failed' || status === 'canceled'

  const { data: scan, isLoading, error, refetch } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && !isTerminal(data.status)) {
        return 2000
      }
      return false
    },
  })

  const { data: logs } = useQuery({
    queryKey: ['scanLogs', scanId],
    queryFn: () => getScanLogs(scanId),
    refetchInterval: (query) => {
      if (scan && !isTerminal(scan.status)) {
        return 2000
      }
      return false
    },
    enabled: !!scan,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] })
      setCancelDialogOpen(false)
    },
    onError: () => {
      toast.error('取消失败，请重试')
    },
  })

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && logs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs?.length])

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !scan) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const filteredLogs = logs?.filter((log) => {
    if (logFilter === 'all') return true
    return log.level === logFilter
  })

  const infoItems = [
    { label: 'ID', value: scan.id },
    { label: 'Agent', value: scan.agentName || scan.agentId },
    { label: '创建时间', value: formatDate(scan.createdAt) },
    { label: '开始时间', value: scan.startedAt ? formatDate(scan.startedAt) : '-' },
    { label: '结束时间', value: scan.finishedAt ? formatDate(scan.finishedAt) : '-' },
    { label: '耗时', value: formatDuration(scan.durationMs) },
  ]

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />
      default:
        return <Info className="h-4 w-4 text-cyan-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title={`任务详情`}
        breadcrumbs={[
          { title: '检测任务', href: '/scans' },
          { title: shortId(scanId) },
        ]}
        actions={
          <div className="flex gap-2">
            {scan.status === 'succeeded' && scan.reportId && (
              <Link href={`/reports/${scan.reportId}`}>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  查看报告
                </Button>
              </Link>
            )}
            {(scan.status === 'queued' || scan.status === 'running') && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <StopCircle className="h-4 w-4 mr-2" />
                取消任务
              </Button>
            )}
            <Link href={`/scans/new?agentId=${scan.agentId}&copyFrom=${scan.id}`}>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                重跑任务
              </Button>
            </Link>
            <Link href="/scans">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>状态</CardTitle>
                <StatusBadge status={scan.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              {scan.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">
                      {stageLabels[scan.progress.stage] || scan.progress.stage}
                    </span>
                    <span className="text-white">{scan.progress.percent}%</span>
                  </div>
                  <Progress value={scan.progress.percent} />
                  {scan.progress.message && (
                    <p className="text-sm text-white/40">{scan.progress.message}</p>
                  )}
                </div>
              )}

              {/* Failed message */}
              {scan.status === 'failed' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">任务执行失败</span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">
                    {scan.progress?.message || '请检查日志了解详细错误信息'}
                  </p>
                </div>
              )}

              {/* Types */}
              <div>
                <div className="text-sm text-white/40 mb-2">检测类型</div>
                <div className="flex gap-2">
                  {scan.types.map((type) => (
                    <Badge key={type} variant="outline">
                      {scanTypeLabels[type] || type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>执行日志</CardTitle>
                <div className="flex gap-1">
                  {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={logFilter === filter ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setLogFilter(filter)}
                    >
                      {filter === 'all' ? '全部' : filter.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {filteredLogs?.length === 0 ? (
                    <div className="text-center text-white/40 py-8">
                      暂无日志
                    </div>
                  ) : (
                    filteredLogs?.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg text-sm',
                          log.level === 'error' && 'bg-red-500/5',
                          log.level === 'warn' && 'bg-amber-500/5'
                        )}
                      >
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="text-white/80 break-words">{log.message}</div>
                          <div className="text-xs text-white/40 mt-1">
                            {formatDate(log.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Side Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueGrid items={infoItems} columns={1} />
            </CardContent>
          </Card>

          {/* Params */}
          {scan.params && Object.keys(scan.params).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>检测参数</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-white/60 overflow-auto">
                  {JSON.stringify(scan.params, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="取消任务"
        description="确定要取消这个检测任务吗？已完成的检测进度将丢失。"
        confirmLabel="取消任务"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate(scanId)}
      />
    </motion.div>
  )
}
