'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronUp, Copy, FileJson, FileText as FilePdf, Check } from 'lucide-react'
import { toast } from 'sonner'

import { CodeBlock } from '@/components/common/code-block'
import { ErrorState } from '@/components/common/error-state'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { RiskBadge } from '@/components/badges/risk-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { downloadReport, getReportDetail } from '@/lib/api'
import type { ExposureFinding, FuzzingFinding, ReportDetail } from '@/lib/types'
import { formatDate, shortId } from '@/lib/utils'

export default function ReportDetailPage() {
  const params = useParams()
  const reportId = params.id as string

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['reportDetail', reportId],
    queryFn: () => getReportDetail(reportId),
  })

  const handleDownload = async (format: 'pdf' | 'json') => {
    try {
      toast.info('开始下载...')
      const blob = await downloadReport(reportId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${shortId(reportId)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('下载完成')
    } catch {
      toast.error('下载失败')
    }
  }

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !report) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHeader
        title={report.title || report.agentName || '报告'}
        description="报告仅保留工具级 DOE 与组合式漏洞结果，避免无关信息堆叠。"
        breadcrumbs={[
          { title: '报告', href: '/reports' },
          { title: shortId(report.id) },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDownload('pdf')}>
              <FilePdf className="mr-2 h-4 w-4" />
              下载 PDF
            </Button>
            <Button variant="outline" onClick={() => handleDownload('json')}>
              <FileJson className="mr-2 h-4 w-4" />
              导出 JSON
            </Button>
            <Link href="/reports">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回报告
              </Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[1.8rem] md:col-span-2">
          <CardContent className="flex items-center gap-5 p-6">
            <RiskBadge risk={report.risk} className="px-4 py-2 text-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">报告时间</p>
              <p className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-50">{formatDate(report.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem]">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">工具数量</p>
            <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50">{report.toolCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[1.8rem]">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">总发现数</p>
            <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50">{report.summary.totalFindings}</p>
          </CardContent>
        </Card>
      </section>

      {report.overviewText && report.overviewText.length > 0 && (
        <Card className="rounded-[1.8rem]">
          <CardHeader>
            <CardTitle>报告摘要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.overviewText.map((item, index) => (
              <p key={index} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <ResultSection
        title="存在 DOE 的工具"
        count={report.summary.doeToolCount || report.exposure?.findings.length || 0}
        emptyText="本次报告没有发现存在 DOE 的工具。"
        findings={report.exposure?.findings || []}
        type="exposure"
      />

      <ResultSection
        title="存在组合式漏洞的工具"
        count={report.summary.chainToolCount || report.fuzzing?.findings.length || 0}
        emptyText="本次报告没有发现存在组合式漏洞的工具。"
        findings={report.fuzzing?.findings || []}
        type="fuzzing"
      />

      <Card className="rounded-[1.8rem]">
        <CardHeader>
          <CardTitle>原始数据</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock code={JSON.stringify(report.raw || report, null, 2)} language="json" maxHeight="520px" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ResultSection({
  title,
  count,
  emptyText,
  findings,
  type,
}: {
  title: string
  count: number
  emptyText: string
  findings: Array<ExposureFinding | FuzzingFinding>
  type: 'exposure' | 'fuzzing'
}) {
  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{count} 个工具</Badge>
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

function FindingCard({
  finding,
  type,
}: {
  finding: ExposureFinding | FuzzingFinding
  type: 'exposure' | 'fuzzing'
}) {
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
        {open ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-200 bg-white/40 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/20">
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{finding.description}</p>
          {finding.toolSignature && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              工具签名：<span className="font-mono">{finding.toolSignature}</span>
            </p>
          )}
          {finding.detectionInfo && (
            <p className="text-sm text-slate-500 dark:text-slate-400">检测信息：{finding.detectionInfo}</p>
          )}
          {type === 'exposure' && 'dataType' in finding && (
            <p className="text-sm text-slate-500 dark:text-slate-400">数据类型：{finding.dataType}</p>
          )}
          {type === 'fuzzing' && 'attackType' in finding && (
            <p className="text-sm text-slate-500 dark:text-slate-400">漏洞类型：{finding.attackType}</p>
          )}
          {finding.evidence && <CopyableEvidence evidence={finding.evidence} />}
        </div>
      )}
    </div>
  )
}

function CopyableEvidence({ evidence }: { evidence: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(evidence)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">检测证据</p>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <CodeBlock code={evidence} language="json" maxHeight="220px" />
    </div>
  )
}
