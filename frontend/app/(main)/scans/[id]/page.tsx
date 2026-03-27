'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, FileText, Info, RotateCcw, StopCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { ErrorState } from '@/components/common/error-state'
import { KeyValueGrid } from '@/components/common/key-value-grid'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/badges/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cancelScan, getScan, getScanLogs } from '@/lib/api'
import type { LogEntry, Scan } from '@/lib/types'
import { cn, formatDate, formatDuration, scanTypeLabels, shortId, stageLabels } from '@/lib/utils'

function getTaskTitle(scan: Scan) {
  return typeof scan.params?.taskName === 'string' ? scan.params.taskName : scan.title || scan.agentName || shortId(scan.id)
}

function getToolCount(scan: Scan) {
  return typeof scan.params?.toolCount === 'number' ? scan.params.toolCount : 0
}

function getSelectedChecks(scan: Scan) {
  return Array.isArray(scan.params?.selectedChecks) ? (scan.params.selectedChecks as string[]) : scan.types
}

export default function ScanDetailPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const scanId = params.id as string
  const logsEndRef = useRef<HTMLDivElement>(null)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all')

  const isTerminal = (status?: string) => status === 'succeeded' || status === 'failed' || status === 'canceled'

  const { data: scan, isLoading, error, refetch } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId),
    refetchInterval: (query) => {
      const data = query.state.data
      return data && !isTerminal(data.status) ? 2000 : false
    },
  })

  const { data: logs } = useQuery({
    queryKey: ['scanLogs', scanId],
    queryFn: () => getScanLogs(scanId),
    enabled: Boolean(scan),
    refetchInterval: () => (scan && !isTerminal(scan.status) ? 2000 : false),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] })
      setCancelDialogOpen(false)
    },
    onError: () => {
      toast.error('取消失败，请稍后重试')
    },
  })

  useEffect(() => {
    if (logsEndRef.current && logs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs?.length])

  const filteredLogs = useMemo(() => {
    return logs?.filter((log) => (logFilter === 'all' ? true : log.level === logFilter)) ?? []
  }, [logFilter, logs])

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !scan) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const infoItems = [
    { label: '任务 ID', value: scan.id },
    { label: '任务名称', value: getTaskTitle(scan) },
    { label: '工具数量', value: `${getToolCount(scan)} 个` },
    { label: '创建时间', value: formatDate(scan.createdAt) },
    { label: '开始时间', value: scan.startedAt ? formatDate(scan.startedAt) : '-' },
    { label: '结束时间', value: scan.finishedAt ? formatDate(scan.finishedAt) : '-' },
    { label: '耗时', value: formatDuration(scan.durationMs) },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader
        title={getTaskTitle(scan)}
        description="查看当前工具 metadata 批次任务的执行状态、输入摘要与日志。"
        breadcrumbs={[
          { title: '任务', href: '/scans' },
          { title: shortId(scanId) },
        ]}
        actions={
          <div className="flex gap-2">
            {scan.status === 'succeeded' && scan.reportId && (
              <Link href={`/reports/${scan.reportId}`}>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  查看报告
                </Button>
              </Link>
            )}
            {(scan.status === 'queued' || scan.status === 'running') && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <StopCircle className="mr-2 h-4 w-4" />
                取消任务
              </Button>
            )}
            <Link href={`/scans/new?copyFrom=${scan.id}`}>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                再次执行
              </Button>
            </Link>
            <Link href="/scans">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回任务
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-[1.8rem]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>执行状态</CardTitle>
                <StatusBadge status={scan.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {scan.progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{stageLabels[scan.progress.stage] || scan.progress.stage}</span>
                    <span className="text-slate-900 dark:text-slate-50">{scan.progress.percent}%</span>
                  </div>
                  <Progress value={scan.progress.percent} />
                  {scan.progress.message && <p className="text-sm text-slate-500 dark:text-slate-400">{scan.progress.message}</p>}
                </div>
              )}

              <div>
                <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">检测范围</div>
                <div className="flex flex-wrap gap-2">
                  {getSelectedChecks(scan).map((type) => (
                    <Badge key={type} variant="outline">
                      {scanTypeLabels[type] || type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>执行日志</CardTitle>
                <div className="flex gap-1">
                  {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                    <Button key={filter} variant={logFilter === filter ? 'secondary' : 'ghost'} size="sm" onClick={() => setLogFilter(filter)}>
                      {filter === 'all' ? '全部' : filter === 'info' ? '信息' : filter === 'warn' ? '警告' : '错误'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px]">
                <div className="space-y-2 pr-4">
                  {filteredLogs.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400">暂无日志</div>
                  ) : (
                    filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
                  )}
                  <div ref={logsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[1.8rem]">
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValueGrid items={infoItems} columns={1} />
            </CardContent>
          </Card>

          <Card className="rounded-[1.8rem]">
            <CardHeader>
              <CardTitle>输入摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>本任务基于同一组工具 metadata 同时执行 DOE 与组合式漏洞检测。</p>
              <p>输出只保留工具级结论：哪些工具存在 DOE，哪些工具存在组合式漏洞。</p>
              {typeof scan.params?.metadataFilename === 'string' && <p>输入文件：{scan.params.metadataFilename}</p>}
            </CardContent>
          </Card>

          {scan.params && Object.keys(scan.params).length > 0 && (
            <Card className="rounded-[1.8rem]">
              <CardHeader>
                <CardTitle>任务参数</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto text-xs text-slate-500 dark:text-slate-400">{JSON.stringify(scan.params, null, 2)}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="取消任务"
        description="确认取消这个任务吗？"
        confirmLabel="取消任务"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate(scanId)}
      />
    </motion.div>
  )
}

function LogRow({ log }: { log: LogEntry }) {
  const icon =
    log.level === 'error' ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : log.level === 'warn' ? (
      <AlertTriangle className="h-4 w-4 text-amber-400" />
    ) : (
      <Info className="h-4 w-4 text-[#f27835]" />
    )

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 text-sm',
        log.level === 'error' && 'bg-red-500/5',
        log.level === 'warn' && 'bg-amber-500/5'
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="break-words text-slate-700 dark:text-slate-300">{log.message}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</div>
      </div>
    </div>
  )
}
