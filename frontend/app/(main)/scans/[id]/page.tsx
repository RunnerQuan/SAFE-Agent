'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import ReactMarkdown from 'react-markdown'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileJson,
  FileText,
  Info,
  ShieldAlert,
  StopCircle,
  Waypoints,
  XCircle,
  Target,
  Flame,
  Link2,
  Search,
  X,
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
  const [logDialogOpen, setLogDialogOpen] = useState(false)

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

  // 只在任务运行中且用户没有手动滚动时自动滚动到底部
  const [userScrolled, setUserScrolled] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 只在任务运行/排队状态且用户未手动滚动时自动滚动
    if (scan && (scan.status === 'queued' || scan.status === 'running') && logsEndRef.current && !userScrolled) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs?.length, scan?.status, userScrolled])

  const filteredLogs = useMemo(() => {
    return logs?.filter((log) => (logFilter === 'all' ? true : log.level === logFilter)) ?? []
  }, [logFilter, logs])

  const handleDownload = async (format: 'pdf' | 'json') => {
    try {
      if (!scan) {
        toast.error('当前任务尚未加载完成。')
        return
      }

      toast.info('开始导出报告…')
      const taskName = getTaskTitle(scan)
      const fileName = `检测报告-${taskName}`

      if (format === 'pdf') {
        // 使用html2canvas + jsPDF生成PDF，彻底解决中文乱码问题
        // 采用逐元素渲染策略，避免内容被截断
        const scanData = scan
        const summary = scanData.summary
        
        // A4尺寸（mm）
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const margin = 20 // 页边距
        const contentWidth = pdfWidth - margin * 2
        
        // 创建临时容器样式
        const containerStyle = `
          width: ${contentWidth * 3.78}px; /* mm to px approx */
          padding: 0;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        `
        
        let currentY = margin
        let isFirstPage = true
        
        // 辅助函数：渲染单个元素到PDF
        const renderElementToPDF = async (html: string, isNewSection = false) => {
          const tempDiv = document.createElement('div')
          tempDiv.style.cssText = containerStyle
          tempDiv.innerHTML = html
          document.body.appendChild(tempDiv)
          
          try {
            const canvas = await html2canvas(tempDiv, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
            })
            
            const imgData = canvas.toDataURL('image/png')
            const imgHeight = (canvas.height * contentWidth) / canvas.width
            
            // 检查是否需要新页面
            if (!isFirstPage && (currentY + imgHeight > pdfHeight - margin)) {
              pdf.addPage()
              currentY = margin
            }
            isFirstPage = false
            
            // 如果单个元素超过一页，需要特殊处理
            if (imgHeight > pdfHeight - margin * 2) {
              // 元素太高，需要分割
              const scaleFactor = contentWidth / canvas.width
              const availableHeight = pdfHeight - margin * 2
              let remainingHeight = canvas.height
              let sourceY = 0
              
              while (remainingHeight > 0) {
                const sliceHeight = Math.min(remainingHeight, availableHeight / scaleFactor)
                const sliceCanvas = document.createElement('canvas')
                sliceCanvas.width = canvas.width
                sliceCanvas.height = sliceHeight
                const ctx = sliceCanvas.getContext('2d')
                
                if (ctx) {
                  ctx.drawImage(
                    canvas,
                    0, sourceY, canvas.width, sliceHeight,
                    0, 0, canvas.width, sliceHeight
                  )
                  
                  const sliceImgData = sliceCanvas.toDataURL('image/png')
                  const sliceHeightMm = sliceHeight * scaleFactor
                  pdf.addImage(sliceImgData, 'PNG', margin, currentY, contentWidth, sliceHeightMm)
                }
                
                remainingHeight -= sliceHeight
                sourceY += sliceHeight
                
                if (remainingHeight > 0) {
                  pdf.addPage()
                  currentY = margin
                }
              }
            } else {
              pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight)
              currentY += imgHeight + 8 // 添加间距
            }
          } finally {
            document.body.removeChild(tempDiv)
          }
        }
        
        // 渲染标题页
        await renderElementToPDF(`
          <div style="padding: 20px 0;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #1a1a1a;">
              SAFE-Agent Toolchain Risk Analysis Report
            </h1>
            
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #333;">任务信息</h2>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
                <p style="margin: 4px 0;"><strong>任务名称：</strong>${taskName}</p>
                <p style="margin: 4px 0;"><strong>任务ID：</strong>${scanData.id}</p>
                <p style="margin: 4px 0;"><strong>创建时间：</strong>${formatDate(scanData.createdAt)}</p>
                <p style="margin: 4px 0;"><strong>工具数量：</strong>${getToolCount(scanData)}</p>
                <p style="margin: 4px 0;"><strong>状态：</strong>${scanData.status}</p>
              </div>
            </div>
            
            <div>
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #333;">检测结果摘要</h2>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
                <p style="margin: 4px 0;"><strong>总发现数：</strong>${summary?.totalFindings ?? 0}</p>
                <p style="margin: 4px 0;"><strong>DOE发现数：</strong>${summary?.exposureFindings ?? 0}</p>
                <p style="margin: 4px 0;"><strong>组合式漏洞发现数：</strong>${summary?.fuzzingFindings ?? 0}</p>
                <p style="margin: 4px 0;"><strong>高风险暴露：</strong>${summary?.highRiskExposureCount ?? 0}</p>
                <p style="margin: 4px 0;"><strong>高风险链路：</strong>${summary?.highRiskChainCount ?? 0}</p>
              </div>
            </div>
          </div>
        `)
        
        // DOE检测结果 - 每个发现单独渲染
        const exposureFindings = scanData.detail?.exposure?.findings
        if (exposureFindings && exposureFindings.length > 0) {
          await renderElementToPDF(`
            <div style="padding: 16px 0;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #333;">数据过度暴露 (DOE) 检测结果</h2>
            </div>
          `, true)
          
          for (const finding of exposureFindings) {
            await renderElementToPDF(`
              <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">${finding.title} (${finding.severity})</p>
                <p style="margin: 4px 0; color: #666;"><strong>工具：</strong>${finding.toolName || 'N/A'}</p>
                <p style="margin: 4px 0; color: #666;"><strong>描述：</strong>${finding.description || ''}</p>
              </div>
            `)
          }
        }
        
        // 组合式漏洞检测结果
        const fuzzingFindings = scanData.detail?.fuzzing?.findings
        if (fuzzingFindings && fuzzingFindings.length > 0) {
          await renderElementToPDF(`
            <div style="padding: 16px 0;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #333;">组合式漏洞检测结果</h2>
            </div>
          `, true)
          
          for (const finding of fuzzingFindings) {
            await renderElementToPDF(`
              <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-weight: bold;">${finding.title} (${finding.severity})</p>
                <p style="margin: 4px 0; color: #666;"><strong>工具：</strong>${finding.toolName || 'N/A'}</p>
                <p style="margin: 4px 0; color: #666;"><strong>描述：</strong>${finding.description || ''}</p>
              </div>
            `)
          }
        }
        
        // 执行摘要
        const executiveSummary = scanData.detail?.executiveSummary
        if (executiveSummary && executiveSummary.length > 0) {
          await renderElementToPDF(`
            <div style="padding: 16px 0;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #333;">执行摘要</h2>
              <div style="background: #f0fff4; border-left: 4px solid #48bb78; padding: 16px; border-radius: 4px;">
                ${executiveSummary.map((item) => `<p style="margin: 8px 0;">• ${item}</p>`).join('')}
              </div>
            </div>
          `, true)
        }
        
        // 主要风险
        const topRisks = summary?.topRisks
        if (topRisks && topRisks.length > 0) {
          await renderElementToPDF(`
            <div style="padding: 16px 0;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 16px; color: #333;">主要风险</h2>
              <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 16px; border-radius: 4px;">
                ${topRisks.map((risk, index) => `<p style="margin: 8px 0;">${index + 1}. ${risk}</p>`).join('')}
              </div>
            </div>
          `)
        }
        
        pdf.save(`${fileName}.pdf`)
        toast.success('PDF导出完成。')
      } else {
        // JSON导出
        const blob = await downloadReport(scanId, format)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('导出完成。')
      }
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
        descriptionClassName="page-header-description-lg"
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
            <Link href="/scans">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回任务
              </Button>
            </Link>
          </div>
        }
      />

      {/* 状态概览区 */}
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="总风险发现"
          value={scan.summary?.totalFindings ?? 0}
          subtitle={scan.summary?.totalFindings ? `DOE ${scan.summary.exposureFindings} · 组合式 ${scan.summary.fuzzingFindings}` : '暂无结果'}
          tone="primary"
          status={scan.status}
          icon={Target}
        />
        <MetricCard
          label="高风险 DOE"
          value={scan.summary?.highRiskExposureCount ?? 0}
          subtitle="需优先关注"
          tone="warm"
          icon={Flame}
        />
        <MetricCard
          label="高风险链路"
          value={scan.summary?.highRiskChainCount ?? 0}
          subtitle="跨工具调用链"
          tone="cool"
          icon={Link2}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <ExecutionTracks scan={scan} />
          <ExecutiveSummary scan={scan} />
          {/* 数据过度暴露检测结果 - 仅在启用检测时显示 */}
          {scan.checks?.exposure?.status !== 'skipped' && (
            <FindingsSection
              title="数据过度暴露检测结果"
              icon={ShieldAlert}
              tone="warm"
              emptyText="当前任务没有 DOE 结果，或本次未启用 DOE 检测。"
              findings={scan.detail?.exposure?.findings ?? []}
              type="exposure"
            />
          )}
          {/* 组合式漏洞检测结果 - 仅在启用检测时显示 */}
          {scan.checks?.fuzzing?.status !== 'skipped' && (
            <FindingsSection
              title="组合式漏洞检测结果"
              icon={Waypoints}
              tone="cool"
              emptyText="当前任务没有组合式漏洞结果。"
              findings={scan.detail?.fuzzing?.findings ?? []}
              type="fuzzing"
            />
          )}
          <RawArtifacts scan={scan} />
        </div>

        <div className="space-y-5">
          {/* 任务信息卡片 */}
          <Card className="rounded-[1.8rem] border-slate-200/60 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Info className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold">任务信息</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <KeyValueGrid items={infoItems} columns={1} />
            </CardContent>
          </Card>

          {/* 执行日志卡片 */}
          <Card className="rounded-[1.8rem] border-slate-200/60 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base font-bold">执行日志</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{filteredLogs.length} 条</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setLogDialogOpen(true)}
                    title="放大查看"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={logFilter === filter ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setLogFilter(filter)}
                  >
                    {filter === 'all' ? '全部' : filter === 'info' ? '信息' : filter === 'warn' ? '警告' : '错误'}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[380px] rounded-[1rem] border border-slate-200/60 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20">
                <div className="space-y-1 p-2 min-w-full" onScroll={() => setUserScrolled(true)}>
                  {filteredLogs.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">暂无日志</div>
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

      {/* 日志放大查看弹窗 */}
      {logDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setLogDialogOpen(false)}>
          <div className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">执行日志</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{filteredLogs.length} 条日志记录</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 筛选按钮 */}
                <div className="flex flex-wrap gap-1.5 mr-4">
                  {(['all', 'info', 'warn', 'error'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={logFilter === filter ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setLogFilter(filter)}
                    >
                      {filter === 'all' ? '全部' : filter === 'info' ? '信息' : filter === 'warn' ? '警告' : '错误'}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLogDialogOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* 弹窗内容 */}
            <div className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full rounded-[1rem] border border-slate-200/60 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-950/20">
                <div className="space-y-1 p-3 min-w-full">
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">暂无日志</div>
                  ) : (
                    filteredLogs.map((log) => <LogRow key={log.id} log={log} />)
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

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

function MetricCard({
  label,
  value,
  subtitle,
  tone = 'neutral',
  status,
  icon: Icon,
}: {
  label: string
  value: number
  subtitle?: string
  tone?: 'primary' | 'warm' | 'cool' | 'neutral'
  status?: ScanStatus
  icon?: React.ComponentType<{ className?: string }>
}) {
  const toneStyles = {
    primary: 'from-sky-50/80 to-white/60 dark:from-sky-950/20 dark:to-slate-950/40',
    warm: 'from-amber-50/80 to-white/60 dark:from-amber-950/20 dark:to-slate-950/40',
    cool: 'from-emerald-50/80 to-white/60 dark:from-emerald-950/20 dark:to-slate-950/40',
    neutral: 'from-slate-50/80 to-white/60 dark:from-slate-950/20 dark:to-slate-950/40',
  }

  const iconStyles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    warm: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    cool: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  }

  const statusDot = status && (
    <span className={`inline-block h-2 w-2 rounded-full ${status === 'running' ? 'animate-pulse bg-sky-500' : status === 'succeeded' ? 'bg-emerald-500' : status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`} />
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className={`rounded-[1.8rem] border-white/70 bg-gradient-to-br ${toneStyles[tone]} shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusDot}
              <p className="scan-detail-label font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{label}</p>
            </div>
            {Icon && (
              <motion.div 
                className={`flex h-9 w-9 items-center justify-center rounded-full ${iconStyles[tone]}`}
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-4 w-4" />
              </motion.div>
            )}
          </div>
          <motion.p 
            className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {value}
          </motion.p>
          {subtitle && <p className="mt-1 scan-detail-subtitle text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ExecutionTracks({ scan }: { scan: Scan }) {
  const checks = [scan.checks?.exposure, scan.checks?.fuzzing].filter(Boolean)

  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="scan-detail-section-title font-bold">执行进度</CardTitle>
          <div className="flex gap-2">
            {getSelectedChecks(scan).map((type) => (
              <Badge key={type} variant={type === 'exposure' ? 'medium' : 'running'}>
                {scanTypeLabels[type]}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div
            key={check!.type}
            className="rounded-[1.5rem] border border-slate-200/80 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    check!.type === 'exposure'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300'
                  }`}
                >
                  {check!.type === 'exposure' ? <ShieldAlert className="h-4 w-4" /> : <Waypoints className="h-4 w-4" />}
                </div>
                <p className="scan-detail-value font-medium text-slate-900 dark:text-slate-50">{check!.label}</p>
              </div>
              {check!.status === 'skipped' ? (
                <Badge variant="outline">未启用</Badge>
              ) : (
                <StatusBadge status={check!.status as ScanStatus} />
              )}
            </div>

            {check!.progress ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between scan-detail-subtitle text-slate-500 dark:text-slate-400">
                  <span>{stageLabels[check!.progress.stage] || check!.progress.stage}</span>
                  <span className="font-medium">{check!.progress.percent}%</span>
                </div>
                <Progress value={check!.progress.percent} className="h-2" />
                {check!.progress.message && <p className="scan-detail-subtitle text-slate-500 dark:text-slate-400">{check!.progress.message}</p>}
              </div>
            ) : (
              <p className="mt-4 scan-detail-subtitle text-slate-500 dark:text-slate-400">该检测未产生可展示进度。</p>
            )}

            {typeof check!.findingCount === 'number' && (
              <div className="mt-4 flex items-center gap-2 scan-detail-subtitle">
                <span className="text-slate-500 dark:text-slate-400">当前结果数：</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">{check!.findingCount}</span>
              </div>
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
  const totalFindings = (summary?.exposureFindings ?? 0) + (summary?.fuzzingFindings ?? 0)

  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="scan-detail-section-title font-bold">综合结论</CardTitle>
              <p className="scan-detail-section-desc text-slate-500 dark:text-slate-400">
                {totalFindings > 0 ? `本次检测共发现 ${totalFindings} 条风险` : '任务正在运行或当前未识别出明确风险结果'}
              </p>
            </div>
          </div>
          {scan.detail?.risk && scan.detail.risk !== 'unknown' && <RiskBadge risk={scan.detail.risk} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryChip icon={ShieldAlert} label="DOE 结果" value={summary?.exposureFindings ?? 0} tone="warm" delay={0} />
          <SummaryChip icon={Waypoints} label="链路结果" value={summary?.fuzzingFindings ?? 0} tone="cool" delay={1} />
          <SummaryChip icon={AlertTriangle} label="高风险项" value={(summary?.highRiskExposureCount ?? 0) + (summary?.highRiskChainCount ?? 0)} tone="danger" delay={2} />
        </div>

        {(detail?.executiveSummary ?? []).length > 0 && (
          <div className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <p className="mb-2 scan-detail-label uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">执行摘要</p>
            <div className="space-y-2">
              {detail?.executiveSummary?.map((item) => (
                <p key={item} className="scan-detail-section-desc leading-7 text-slate-600 dark:text-slate-300">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {(summary?.topRisks ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="scan-detail-label uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">主要风险：</span>
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

function SummaryChip({ icon: Icon, label, value, tone = 'neutral', delay = 0 }: { icon: typeof ShieldAlert; label: string; value: number; tone?: 'warm' | 'cool' | 'danger' | 'neutral'; delay?: number }) {
  const toneStyles = {
    warm: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    cool: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    danger: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    neutral: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300',
  }

  return (
    <motion.div 
      className="rounded-[1.4rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/35"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className={`flex h-10 w-10 items-center justify-center rounded-full ${toneStyles[tone]}`}
          whileHover={{ rotate: 15 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
        <div>
          <p className="scan-detail-chip-label font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{label}</p>
          <motion.p 
            className="mt-1 scan-detail-chip-value font-bold text-slate-950 dark:text-slate-50"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: delay * 0.1 + 0.2, type: "spring", stiffness: 200 }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
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
  const toneStyles = {
    warm: 'from-amber-50/90 to-white/60 border-amber-100/60 dark:from-amber-950/20 dark:to-slate-950/40 dark:border-amber-900/30',
    cool: 'from-sky-50/90 to-white/60 border-sky-100/60 dark:from-sky-950/20 dark:to-slate-950/40 dark:border-sky-900/30',
  }

  const iconStyles = {
    warm: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    cool: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  }

  return (
    <Card className={`rounded-[1.8rem] border bg-gradient-to-br ${toneStyles[tone]}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconStyles[tone]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="scan-detail-section-title font-bold">{title}</CardTitle>
              <p className="scan-detail-section-desc text-slate-500 dark:text-slate-400">
                {findings.length > 0 ? `发现 ${findings.length} 条风险` : '暂无检测结果'}
              </p>
            </div>
          </div>
          {findings.length > 0 && (
            <Badge variant={tone === 'warm' ? 'medium' : 'running'}>{findings.length} 条结果</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {findings.length > 0 ? (
          findings.map((finding) => <FindingCard key={finding.id} finding={finding} type={type} />)
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center dark:border-slate-800 dark:bg-slate-950/20">
            <p className="scan-detail-subtitle text-slate-500 dark:text-slate-400">{emptyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FindingCard({ finding, type }: { finding: ExposureFinding | FuzzingFinding; type: ScanType }) {
  const [open, setOpen] = useState(false)
  const trace = type === 'fuzzing' && 'trace' in finding && Array.isArray(finding.trace) ? finding.trace : []
  
  // 解析DOE的evidence中的flowPath（工具调用链）和泄露字段
  let doeFlowPath: string[] = []
  let leakedFields: string[] = []
  if (type === 'exposure' && finding.evidence) {
    try {
      const evidence = JSON.parse(finding.evidence)
      // 提取工具调用链
      if (evidence.flowPath && Array.isArray(evidence.flowPath)) {
        doeFlowPath = evidence.flowPath
      }
      // 尝试从evidence中提取泄露字段（支持多种字段名）
      if (evidence.leakedFields && Array.isArray(evidence.leakedFields)) {
        leakedFields = evidence.leakedFields
      } else if (evidence.fineGrainItems && Array.isArray(evidence.fineGrainItems)) {
        leakedFields = evidence.fineGrainItems
      }
    } catch {
      // 解析失败则忽略
    }
  }

  const severityLabel = finding.severity === 'high' ? '高危' : finding.severity === 'medium' ? '中危' : '低危'
  const severityIcon = finding.severity === 'high' ? '!' : finding.severity === 'medium' ? '⚠' : 'ℹ'

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white/60 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/80 dark:hover:bg-slate-950/50"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${finding.severity === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : finding.severity === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'}`}>
            {severityIcon}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={finding.severity}>{severityLabel}</Badge>
              {finding.toolName && <Badge variant="outline">{finding.toolName}</Badge>}
            </div>
            <p className="scan-detail-finding-title font-medium text-slate-900 dark:text-slate-50">{finding.title}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${open ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:bg-sky-900/50'}`}>
          {open ? '收起详情' : '查看详情'}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200/60 bg-slate-50/40 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/20">
          {/* 描述文本 */}
          <div className="scan-detail-finding-desc text-sm leading-7 text-slate-600 dark:text-slate-300">
            {finding.description}
          </div>
          
          {/* 组合式漏洞链路展示 */}
          {trace.length > 0 && (
            <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50/80 to-blue-50/60 p-4 dark:border-sky-800/60 dark:from-sky-950/30 dark:to-blue-950/20">
              <p className="mb-3 text-sm font-semibold text-sky-700 dark:text-sky-300">调用链路</p>
              <div className="flex flex-wrap items-center gap-2">
                {trace.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                      {step}
                    </span>
                    {index < trace.length - 1 && (
                      <span className="text-sky-400 dark:text-sky-500">
                        <Waypoints className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* DOE工具调用链展示 - 与组合式漏洞相同风格 */}
          {type === 'exposure' && doeFlowPath.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-orange-950/20">
              <p className="mb-3 text-sm font-semibold text-amber-700 dark:text-amber-300">工具调用链</p>
              <div className="flex flex-wrap items-center gap-2">
                {doeFlowPath.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                      {step}
                    </span>
                    {index < doeFlowPath.length - 1 && (
                      <span className="text-amber-400 dark:text-amber-500">
                        <Waypoints className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* DOE泄露字段明确展示 */}
          {type === 'exposure' && leakedFields.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50/80 to-pink-50/60 p-4 dark:border-rose-800/60 dark:from-rose-950/30 dark:to-pink-950/20">
              <p className="mb-3 text-sm font-semibold text-rose-700 dark:text-rose-300">泄露字段 ({leakedFields.length} 项)</p>
              <div className="flex flex-wrap gap-2">
                {leakedFields.map((field, index) => (
                  <span 
                    key={index} 
                    className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm dark:bg-slate-800/80 dark:text-rose-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 scan-detail-meta">
            {finding.toolSignature && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">工具签名：</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">{finding.toolSignature}</code>
              </div>
            )}
            {finding.detectionInfo && (
              <div className="w-full">
                {/* 解析检测信息中的工具调用链 */}
                {(() => {
                  const info = finding.detectionInfo as string
                  // 匹配 "工具调用链：xxx -> yyy -> zzz" 格式
                  const chainMatch = info.match(/工具调用链[：:]\s*(.+)/)
                  if (chainMatch) {
                    const chainText = chainMatch[1].trim()
                    // 分割调用链步骤
                    const chainSteps = chainText.split(/\s*->\s*/).filter(s => s.trim())
                    if (chainSteps.length > 0) {
                      return (
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 dark:border-amber-800/60 dark:from-amber-950/30 dark:to-orange-950/20">
                          <p className="mb-3 text-sm font-semibold text-amber-700 dark:text-amber-300">工具调用链</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {chainSteps.map((step, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                                  {step}
                                </span>
                                {index < chainSteps.length - 1 && (
                                  <span className="text-amber-400 dark:text-amber-500">
                                    <Waypoints className="h-4 w-4" />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  }
                  // 如果没有匹配到工具调用链格式，显示原始文本
                  return (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">检测信息：</span>
                      <span className="text-slate-600 dark:text-slate-300">{finding.detectionInfo}</span>
                    </div>
                  )
                })()}
              </div>
            )}
            {type === 'exposure' && 'dataType' in finding && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">数据类型：</span>
                <span className="text-slate-600 dark:text-slate-300">{finding.dataType}</span>
              </div>
            )}
            {type === 'fuzzing' && 'attackType' in finding && (
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">漏洞类型：</span>
                <span className="text-slate-600 dark:text-slate-300">{finding.attackType}</span>
              </div>
            )}
          </div>
          {finding.evidence && <CodeBlock code={finding.evidence} language="json" maxHeight="260px" />}
        </div>
      )}
    </div>
  )
}

function RawArtifacts({ scan }: { scan: Scan }) {
  const raw = scan.detail?.raw

  return (
    <Card className="rounded-[1.8rem] border-slate-200/60 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="scan-detail-section-title font-bold">原始产物</CardTitle>
            <p className="scan-detail-subtitle text-slate-500 dark:text-slate-400">完整任务输出数据</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CodeBlock code={JSON.stringify(raw ?? scan, null, 2)} language="json" maxHeight="520px" />
      </CardContent>
    </Card>
  )
}

function LogRow({ log }: { log: LogEntry }) {
  const iconBg =
    log.level === 'error'
      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
      : log.level === 'warn'
        ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        : log.message.includes('[DOE]')
          ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
          : log.message.includes('[组合]')
            ? 'bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'

  const Icon =
    log.level === 'error'
      ? XCircle
      : log.level === 'warn'
        ? AlertTriangle
        : log.message.includes('[DOE]')
          ? ShieldAlert
          : log.message.includes('[组合]')
            ? Waypoints
            : Clock3

  return (
    <div className="flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="scan-detail-log-message whitespace-pre-wrap break-all text-slate-700 dark:text-slate-300">{log.message}</div>
        <div className="scan-detail-log-time mt-0.5 text-slate-400">{formatDate(log.timestamp)}</div>
      </div>
    </div>
  )
}
