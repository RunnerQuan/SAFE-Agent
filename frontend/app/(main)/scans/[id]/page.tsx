'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileJson,
  FileText,
  Info,
  RotateCcw,
  ShieldAlert,
  StopCircle,
  Waypoints,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { CodeBlock } from '@/components/common/code-block'
import { ErrorState } from '@/components/common/error-state'
import { KeyValueGrid } from '@/components/common/key-value-grid'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { RiskBadge } from '@/components/badges/risk-badge'
import { StatusBadge } from '@/components/badges/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cancelScan, downloadReport, getScan, getScanLogs } from '@/lib/api'
import type { ExposureFinding, FuzzingFinding, LogEntry, Scan, ScanStatus, ScanType } from '@/lib/types'
import { formatDate, formatDuration, scanTypeLabels, shortId, stageLabels } from '@/lib/utils'

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

  const { data: scan, isLoading, error, refetch } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => getScan(scanId),
    refetchInterval: (query) => {
      const data = query.state.data
      return data && (data.status === 'queued' || data.status === 'running') ? 2000 : false
    },
  })

  const { data: logs } = useQuery({
    queryKey: ['scanLogs', scanId],
    queryFn: () => getScanLogs(scanId),
    enabled: Boolean(scan),
    refetchInterval: () => (scan && (scan.status === 'queued' || scan.status === 'running') ? 2000 : false),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消。')
      queryClient.invalidateQueries({ queryKey: ['scan', scanId] })
      setCancelDialogOpen(false)
    },
    onError: () => {
      toast.error('取消失败，请稍后重试。')
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

  const handleDownload = async (format: 'pdf' | 'json') => {
    try {
      toast.info('开始导出报告…')
      const blob = await downloadReport(scanId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${shortId(scanId)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('导出完成。')
    } catch {
      toast.error('导出失败。')
    }
  }

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

  const canCancel = scan.status === 'queued' || scan.status === 'running'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader
        title={getTaskTitle(scan)}
        description="同一页面查看执行状态、DOE 结果、组合式漏洞结果以及综合结论。"
        breadcrumbs={[
          { title: '任务', href: '/scans' },
          { title: shortId(scanId) },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleDownload('json')}>
              <FileJson className="mr-2 h-4 w-4" />
              导出 JSON
            </Button>
            <Button variant="outline" onClick={() => handleDownload('pdf')}>
              <FileText className="mr-2 h-4 w-4" />
              下载 PDF
            </Button>
            {canCancel && (
              <Button variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                <StopCircle className="mr-2 h-4 w-4" />
                取消任务
              </Button>
            )}
            <Link href={`/scans/new?copyFrom=${scan.id}`}>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                重新运行
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

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="rounded-[1.8rem] xl:col-span-2">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={scan.status} />
                <RiskBadge risk={scan.detail?.risk ?? 'unknown'} />
              </div>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {scan.summary?.totalFindings
                  ? `本次联合检测共识别 ${scan.summary.totalFindings} 条结果，其中 DOE ${scan.summary.exposureFindings} 条、组合式漏洞 ${scan.summary.fuzzingFindings} 条。`
                  : '任务正在运行或当前未识别出明确风险结果。'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {getSelectedChecks(scan).map((type) => (
                <Badge key={type} variant={type === 'exposure' ? 'medium' : 'running'}>
                  {scanTypeLabels[type]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <MetricCard label="高风险 DOE" value={scan.summary?.highRiskExposureCount ?? 0} />
        <MetricCard label="高风险链路" value={scan.summary?.highRiskChainCount ?? 0} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <ExecutionTracks scan={scan} />
          <ExecutiveSummary scan={scan} />
          <FindingsSection
            title="数据过度暴露检测结果"
            icon={ShieldAlert}
            tone="warm"
            emptyText="当前任务没有 DOE 结果，或本次未启用 DOE 检测。"
            findings={scan.detail?.exposure?.findings ?? []}
            type="exposure"
          />
          <FindingsSection
            title="组合式漏洞检测结果"
            icon={Waypoints}
            tone="cool"
            emptyText="当前任务没有组合式漏洞结果。"
            findings={scan.detail?.fuzzing?.findings ?? []}
            type="fuzzing"
          />
          <RawArtifacts scan={scan} />
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
              <CardTitle>执行日志</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                  <Button key={filter} variant={logFilter === filter ? 'secondary' : 'ghost'} size="sm" onClick={() => setLogFilter(filter)}>
                    {filter === 'all' ? '全部' : filter === 'info' ? '信息' : filter === 'warn' ? '警告' : '错误'}
                  </Button>
                ))}
              </div>
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
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="取消任务"
        description="确认取消这个联合检测任务吗？"
        confirmLabel="取消任务"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate(scanId)}
      />
    </motion.div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-[1.8rem]">
      <CardContent className="p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50">{value}</p>
      </CardContent>
    </Card>
  )
}

function ExecutionTracks({ scan }: { scan: Scan }) {
  const checks = [scan.checks?.exposure, scan.checks?.fuzzing].filter(Boolean)

  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader>
        <CardTitle>执行进度</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check!.type} className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/35">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900 dark:text-slate-50">{check!.label}</p>
              {check!.status === 'skipped' ? <Badge variant="outline">未启用</Badge> : <StatusBadge status={check!.status as ScanStatus} />}
            </div>

            {check!.progress ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>{stageLabels[check!.progress.stage] || check!.progress.stage}</span>
                  <span>{check!.progress.percent}%</span>
                </div>
                <Progress value={check!.progress.percent} />
                {check!.progress.message && <p className="text-sm text-slate-500 dark:text-slate-400">{check!.progress.message}</p>}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">该检测未产生可展示进度。</p>
            )}

            {typeof check!.findingCount === 'number' && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">当前结果数：{check!.findingCount}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ExecutiveSummary({ scan }: { scan: Scan }) {
  const summary = scan.summary
  const detail = scan.detail

  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader>
        <CardTitle>综合结论</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryChip icon={ShieldAlert} label="DOE 结果" value={summary?.exposureFindings ?? 0} />
          <SummaryChip icon={Waypoints} label="链路结果" value={summary?.fuzzingFindings ?? 0} />
          <SummaryChip icon={AlertTriangle} label="高风险项" value={(summary?.highRiskExposureCount ?? 0) + (summary?.highRiskChainCount ?? 0)} />
        </div>

        {(detail?.executiveSummary ?? []).length > 0 && (
          <div className="space-y-2">
            {detail?.executiveSummary?.map((item) => (
              <p key={item} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item}
              </p>
            ))}
          </div>
        )}

        {(summary?.topRisks ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary?.topRisks.map((risk) => (
              <Badge key={risk} variant="high">
                {risk}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryChip({ icon: Icon, label, value }: { icon: typeof ShieldAlert; label: string; value: number }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/35">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
        </div>
      </div>
    </div>
  )
}

function FindingsSection({
  title,
  icon: Icon,
  tone,
  emptyText,
  findings,
  type,
}: {
  title: string
  icon: typeof ShieldAlert
  tone: 'warm' | 'cool'
  emptyText: string
  findings: Array<ExposureFinding | FuzzingFinding>
  type: ScanType
}) {
  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                tone === 'warm'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant="outline">{findings.length} 条结果</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {findings.length > 0 ? (
          findings.map((finding) => <FindingCard key={finding.id} finding={finding} type={type} />)
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}

function FindingCard({ finding, type }: { finding: ExposureFinding | FuzzingFinding; type: ScanType }) {
  const [open, setOpen] = useState(false)

  const severityLabel = finding.severity === 'high' ? '高危' : finding.severity === 'medium' ? '中危' : '低危'

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 bg-white/60 px-4 py-4 text-left transition-colors hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/50"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={finding.severity}>{severityLabel}</Badge>
            {finding.toolName && <Badge variant="outline">{finding.toolName}</Badge>}
          </div>
          <p className="font-medium text-slate-900 dark:text-slate-50">{finding.title}</p>
        </div>
        <Info className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200 bg-white/40 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/20">
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{finding.description}</p>
          {finding.toolSignature && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              工具签名：<span className="font-mono">{finding.toolSignature}</span>
            </p>
          )}
          {finding.detectionInfo && <p className="text-sm text-slate-500 dark:text-slate-400">检测信息：{finding.detectionInfo}</p>}
          {type === 'exposure' && 'dataType' in finding && <p className="text-sm text-slate-500 dark:text-slate-400">数据类型：{finding.dataType}</p>}
          {type === 'fuzzing' && 'attackType' in finding && <p className="text-sm text-slate-500 dark:text-slate-400">漏洞类型：{finding.attackType}</p>}
          {finding.evidence && <CodeBlock code={finding.evidence} language="json" maxHeight="260px" />}
        </div>
      )}
    </div>
  )
}

function RawArtifacts({ scan }: { scan: Scan }) {
  const raw = scan.detail?.raw

  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Download className="h-4 w-4 text-slate-500" />
          <CardTitle>原始产物</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CodeBlock code={JSON.stringify(raw ?? scan, null, 2)} language="json" maxHeight="520px" />
      </CardContent>
    </Card>
  )
}

function LogRow({ log }: { log: LogEntry }) {
  const icon =
    log.level === 'error' ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : log.level === 'warn' ? (
      <AlertTriangle className="h-4 w-4 text-amber-400" />
    ) : log.message.includes('[DOE]') ? (
      <ShieldAlert className="h-4 w-4 text-amber-500" />
    ) : log.message.includes('[组合]') ? (
      <Waypoints className="h-4 w-4 text-sky-500" />
    ) : (
      <Clock3 className="h-4 w-4 text-slate-400" />
    )

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 text-sm">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="break-words text-slate-700 dark:text-slate-300">{log.message}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</div>
      </div>
    </div>
  )
}
