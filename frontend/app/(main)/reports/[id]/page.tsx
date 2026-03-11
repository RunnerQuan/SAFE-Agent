'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Download,
  FileJson,
  FileText as FilePdf,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Bug,
  Lightbulb,
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiskBadge } from '@/components/badges/risk-badge'
import { CodeBlock } from '@/components/common/code-block'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getReportDetail, downloadReport } from '@/lib/api'
import { formatDate, shortId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ExposureFinding, FuzzingFinding } from '@/lib/types'

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())
  const [evidenceDialog, setEvidenceDialog] = useState<{ open: boolean; finding: ExposureFinding | FuzzingFinding | null }>({
    open: false,
    finding: null,
  })

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

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !report) {
    return <ErrorState onRetry={() => refetch()} />
  }

  // Chart data
  const severityData = [
    {
      name: '高危',
      value:
        (report.exposure?.findings.filter((f) => f.severity === 'high').length || 0) +
        (report.fuzzing?.findings.filter((f) => f.severity === 'high').length || 0),
    },
    {
      name: '中危',
      value:
        (report.exposure?.findings.filter((f) => f.severity === 'medium').length || 0) +
        (report.fuzzing?.findings.filter((f) => f.severity === 'medium').length || 0),
    },
    {
      name: '低危',
      value:
        (report.exposure?.findings.filter((f) => f.severity === 'low').length || 0) +
        (report.fuzzing?.findings.filter((f) => f.severity === 'low').length || 0),
    },
  ].filter((d) => d.value > 0)

  const categoryData = []
  if (report.summary.exposureFindings) {
    categoryData.push({ name: '数据暴露', value: report.summary.exposureFindings })
  }
  if (report.summary.fuzzingFindings) {
    categoryData.push({ name: '漏洞挖掘', value: report.summary.fuzzingFindings })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="检测报告"
        breadcrumbs={[
          { title: '检测报告', href: '/reports' },
          { title: shortId(reportId) },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleDownload('pdf')}>
              <FilePdf className="h-4 w-4 mr-2" />
              下载 PDF
            </Button>
            <Button variant="outline" onClick={() => handleDownload('json')}>
              <FileJson className="h-4 w-4 mr-2" />
              导出 JSON
            </Button>
            <Link href={`/scans/${report.scanId}`}>
              <Button variant="ghost">
                返回任务
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Button>
            </Link>
          </div>
        }
      />

      {/* Header Summary */}
      <div className="flex items-center gap-6 mb-6 p-6 glass-card">
        <RiskBadge risk={report.risk} className="text-lg px-4 py-2" />
        <div className="flex-1">
                    <div className="text-lg font-medium text-slate-900">{report.agentName}</div>
          <div className="text-sm text-slate-500">{formatDate(report.createdAt)}</div>
        </div>
        <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">{report.summary.totalFindings}</div>
          <div className="text-sm text-slate-500">发现总数</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            概览
          </TabsTrigger>
          {report.exposure && (
            <TabsTrigger value="exposure" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              数据暴露
              <Badge variant="outline" className="ml-1">
                {report.exposure.findings.length}
              </Badge>
            </TabsTrigger>
          )}
          {report.fuzzing && (
            <TabsTrigger value="fuzzing" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              漏洞挖掘
              <Badge variant="outline" className="ml-1">
                {report.fuzzing.findings.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            建议
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            原始数据
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Summary Text */}
            <Card>
              <CardHeader>
                <CardTitle>检测概要</CardTitle>
              </CardHeader>
              <CardContent>
                {report.overviewText && report.overviewText.length > 0 ? (
                  <ul className="space-y-3">
                    {report.overviewText.map((text, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-[#f27835] flex-shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">暂无概要信息</p>
                )}
              </CardContent>
            </Card>

            {/* Severity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>风险分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {severityData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.name === '高危'
                                ? SEVERITY_COLORS.high
                                : entry.name === '中危'
                                ? SEVERITY_COLORS.medium
                                : SEVERITY_COLORS.low
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Stats */}
            {categoryData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>检测类型统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical">
                        <XAxis type="number" stroke="#666" />
                        <YAxis dataKey="name" type="category" stroke="#666" width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Exposure Tab */}
        {report.exposure && (
          <TabsContent value="exposure">
            <Card>
              <CardHeader>
                <CardTitle>数据暴露发现</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.exposure.findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    type="exposure"
                    expanded={expandedFindings.has(finding.id)}
                    onToggle={() => toggleFinding(finding.id)}
                    onViewEvidence={() => setEvidenceDialog({ open: true, finding })}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Fuzzing Tab */}
        {report.fuzzing && (
          <TabsContent value="fuzzing">
            <Card>
              <CardHeader>
                <CardTitle>漏洞挖掘发现</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.fuzzing.findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    type="fuzzing"
                    expanded={expandedFindings.has(finding.id)}
                    onToggle={() => toggleFinding(finding.id)}
                    onViewEvidence={() => setEvidenceDialog({ open: true, finding })}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>安全建议</CardTitle>
            </CardHeader>
            <CardContent>
              {report.recommendations && report.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {report.recommendations.map((rec, i) => (
                    <RecommendationItem key={i} index={i + 1} text={rec} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">暂无建议</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Tab */}
        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>原始数据</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock
                code={JSON.stringify(report.raw || report, null, 2)}
                language="json"
                maxHeight="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialog.open} onOpenChange={(open) => setEvidenceDialog({ open, finding: evidenceDialog.finding })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>证据详情</DialogTitle>
          </DialogHeader>
          {evidenceDialog.finding && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">标题</div>
                        <div className="text-slate-900">{evidenceDialog.finding.title}</div>
              </div>
              {evidenceDialog.finding.evidence && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">证据</div>
                  <CodeBlock code={evidenceDialog.finding.evidence} maxHeight="200px" />
                </div>
              )}
              {'flowPath' in evidenceDialog.finding && evidenceDialog.finding.flowPath && (
                <div>
                  <div className="text-sm text-slate-500 mb-2">数据流路径</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {evidenceDialog.finding.flowPath.map((node, i, arr) => (
                      <div key={i} className="flex items-center">
                        <Badge variant="outline">{node}</Badge>
                        {i < arr.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-slate-500 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {'reproductionSteps' in evidenceDialog.finding && evidenceDialog.finding.reproductionSteps && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">复现步骤</div>
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-white/62 p-4 rounded-lg">
                    {evidenceDialog.finding.reproductionSteps}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// Finding Card Component
function FindingCard({
  finding,
  type,
  expanded,
  onToggle,
  onViewEvidence,
}: {
  finding: ExposureFinding | FuzzingFinding
  type: 'exposure' | 'fuzzing'
  expanded: boolean
  onToggle: () => void
  onViewEvidence: () => void
}) {
  const severityBadge = {
    high: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  }

  return (
    <div className="border border-white/80 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/62 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Badge className={severityBadge[finding.severity]}>
            {finding.severity === 'high' ? '高危' : finding.severity === 'medium' ? '中危' : '低危'}
          </Badge>
                                  <span className="font-medium text-slate-900">{finding.title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <p className="text-sm text-slate-600 mt-3">{finding.description}</p>

          {type === 'exposure' && 'dataType' in finding && (
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">数据类型: </span>
                <Badge variant="outline">{finding.dataType}</Badge>
              </div>
              {finding.source && (
                <div>
                  <span className="text-slate-500">来源: </span>
                  <span className="text-slate-700">{finding.source}</span>
                </div>
              )}
            </div>
          )}

          {type === 'fuzzing' && 'attackType' in finding && (
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">攻击类型: </span>
                <Badge variant="outline">{finding.attackType}</Badge>
              </div>
              {finding.payloadSummary && (
                <div>
                  <span className="text-slate-500">Payload: </span>
                  <span className="text-slate-700">{finding.payloadSummary}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onViewEvidence}>
              查看详情
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Recommendation Item Component
function RecommendationItem({ index, text }: { index: number; text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/62 group">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-[#f27835] text-sm font-medium flex-shrink-0">
        {index}
      </div>
      <p className="flex-1 text-sm text-slate-700">{text}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

