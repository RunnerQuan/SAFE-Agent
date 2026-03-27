'use client'

import { Suspense, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, FileJson, FileText as FilePdf, Filter } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { RiskBadge } from '@/components/badges/risk-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { downloadReport, listReports } from '@/lib/api'
import { formatDate, scanTypeLabels, shortId } from '@/lib/utils'

export default function ReportsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="table" count={5} />}>
      <ReportsContent />
    </Suspense>
  )
}

function ReportsContent() {
  const [filters, setFilters] = useState({
    risk: '',
    type: '',
  })

  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () =>
      listReports({
        risk: filters.risk || undefined,
        type: filters.type || undefined,
      }),
  })

  const summary = useMemo(() => {
    const list = reports || []
    return {
      total: list.length,
      doeTools: list.reduce((sum, item) => sum + (item.summary.doeToolCount || 0), 0),
      chainTools: list.reduce((sum, item) => sum + (item.summary.chainToolCount || 0), 0),
    }
  }, [reports])

  const handleDownload = async (id: string, format: 'pdf' | 'json') => {
    try {
      toast.info('开始下载...')
      const blob = await downloadReport(id, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${shortId(id)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('下载完成')
    } catch {
      toast.error('下载失败')
    }
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="报告"
        description="报告页只保留 DOE 工具、组合式漏洞工具以及对应检测信息。"
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '报告总数', value: summary.total },
          { label: 'DOE 工具', value: summary.doeTools },
          { label: '组合式漏洞工具', value: summary.chainTools },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.8rem]">
            <div className="p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50">{item.value}</p>
            </div>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/72 dark:border-slate-700 dark:bg-slate-950/40">
            <Filter className="h-4 w-4 text-slate-500" />
          </div>
          <Select value={filters.risk} onValueChange={(value) => setFilters((prev) => ({ ...prev, risk: value }))}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="全部风险" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部风险</SelectItem>
              <SelectItem value="high">高风险</SelectItem>
              <SelectItem value="medium">中风险</SelectItem>
              <SelectItem value="low">低风险</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="全部检测类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部检测类型</SelectItem>
            <SelectItem value="exposure">数据过度暴露检测</SelectItem>
            <SelectItem value="fuzzing">组合式漏洞检测</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="rounded-[1.8rem]">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-xl text-slate-950 dark:text-slate-50">{report.title || report.agentName}</p>
                      <RiskBadge risk={report.risk} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span>{shortId(report.id)}</span>
                      <span>{report.toolCount || 0} 个工具</span>
                      <span>{formatDate(report.createdAt)}</span>
                      <span>DOE 工具 {report.summary.doeToolCount || 0}</span>
                      <span>组合式漏洞工具 {report.summary.chainToolCount || 0}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {report.types.map((type) => (
                        <Badge key={type} variant="outline">
                          {scanTypeLabels[type] || type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(report.id, 'pdf')}>
                      <FilePdf className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(report.id, 'json')}>
                      <FileJson className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <EmptyState title="暂无报告" description="任务完成后，报告会出现在这里。" action={{ label: '新建任务', href: '/scans/new' }} />
        </Card>
      )}
    </div>
  )
}
