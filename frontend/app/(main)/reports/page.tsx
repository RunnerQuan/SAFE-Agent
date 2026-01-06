'use client'

import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, Download, FileJson, FileText as FilePdf, FileText, Filter, TrendingUp, AlertTriangle, Bot, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { EmptyState } from '@/components/common/empty-state'
import { RiskBadge } from '@/components/badges/risk-badge'
import { listReports, listAgents, downloadReport } from '@/lib/api'
import { formatDate, shortId, scanTypeLabels } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="table" count={5} />}>
      <ReportsContent />
    </Suspense>
  )
}

function ReportsContent() {
  const searchParams = useSearchParams()
  const agentIdParam = searchParams.get('agentId')

  const [filters, setFilters] = useState({
    agentId: agentIdParam || '',
    risk: '',
    type: '',
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
  })

  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () =>
      listReports({
        agentId: filters.agentId || undefined,
        risk: filters.risk || undefined,
        type: filters.type || undefined,
      }),
  })

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="检测报告"
        description="查看所有安全检测报告，分析风险发现"
        gradient
      />

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10">
            <Filter className="h-4 w-4 text-white/60" />
          </div>
          <Select
            value={filters.agentId}
            onValueChange={(v) => setFilters({ ...filters, agentId: v })}
          >
            <SelectTrigger className="w-[200px] h-10 bg-white/5 border-white/10">
              <SelectValue placeholder="全部 Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部 Agent</SelectItem>
              {agents?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-400" />
                    {agent.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={filters.risk}
          onValueChange={(v) => setFilters({ ...filters, risk: v })}
        >
          <SelectTrigger className="w-[150px] h-10 bg-white/5 border-white/10">
            <SelectValue placeholder="全部风险" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部风险</SelectItem>
            <SelectItem value="high">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                高风险
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                中风险
              </span>
            </SelectItem>
            <SelectItem value="low">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                低风险
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(v) => setFilters({ ...filters, type: v })}
        >
          <SelectTrigger className="w-[150px] h-10 bg-white/5 border-white/10">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="exposure">数据暴露</SelectItem>
            <SelectItem value="fuzzing">漏洞挖掘</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports?.length === 0 ? (
        <Card className="glass-card">
          <EmptyState
            title="暂无报告"
            description="完成检测任务后将生成报告"
            action={{ label: '发起检测', href: '/scans/new' }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {reports?.map((report, index) => (
            <motion.div
              key={report.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card glass-card-hover overflow-hidden group">
                {/* Risk indicator line */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
                  report.risk === 'high'
                    ? 'via-red-500/50'
                    : report.risk === 'medium'
                    ? 'via-amber-500/50'
                    : 'via-emerald-500/50'
                } to-transparent`} />

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Left section */}
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                        report.risk === 'high'
                          ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30'
                          : report.risk === 'medium'
                          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/30'
                          : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30'
                      }`}>
                        {report.risk === 'high' ? (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-white/60" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {shortId(report.id)}
                          </span>
                          <RiskBadge risk={report.risk} />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            {report.agentName || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(report.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {report.summary.totalFindings} 个发现
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center section - Types */}
                    <div className="hidden md:flex items-center gap-2">
                      {report.types.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="bg-purple-500/10 border-purple-500/20 text-purple-300"
                        >
                          {scanTypeLabels[type] || type}
                        </Badge>
                      ))}
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-cyan-500/10 hover:text-cyan-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(report.id, 'pdf')}
                        className="hover:bg-purple-500/10 hover:text-purple-400"
                      >
                        <FilePdf className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(report.id, 'json')}
                        className="hover:bg-emerald-500/10 hover:text-emerald-400"
                      >
                        <FileJson className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
