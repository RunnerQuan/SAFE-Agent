'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  FileText,
  Radar,
  Scan,
  Shield,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { StatusBadge } from '@/components/badges/status-badge'
import { RiskBadge } from '@/components/badges/risk-badge'
import { getDashboardStats, listReports, listScans } from '@/lib/api'
import { formatDate, scanTypeLabels, shortId } from '@/lib/utils'

type MetricCardProps = {
  title: string
  value: number
  description: string
  icon: React.ElementType
  tone: 'orange' | 'teal' | 'amber' | 'rose'
}

const toneMap: Record<MetricCardProps['tone'], string> = {
  orange: 'from-[#ff9146]/18 to-[#ff9146]/5 border-[#ff9146]/28 text-[#c95f1f]',
  teal: 'from-[#14a689]/18 to-[#14a689]/5 border-[#14a689]/28 text-[#0d7f69]',
  amber: 'from-amber-500/18 to-amber-500/5 border-amber-400/28 text-amber-700',
  rose: 'from-rose-500/18 to-rose-500/5 border-rose-400/28 text-rose-700',
}

function MetricCard({ title, value, description, icon: Icon, tone }: MetricCardProps) {
  return (
    <Card className={`stat-card border ${toneMap[tone]}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <p className="text-sm text-slate-600">{title}</p>
          <div className="rounded-lg border border-white/80 bg-white/72 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="font-display text-3xl font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  })

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['dashboardRecentScans'],
    queryFn: () => listScans(),
    select: (data) => data.slice(0, 5),
  })

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['dashboardRecentReports'],
    queryFn: () => listReports(),
    select: (data) => data.slice(0, 5),
  })

  if (statsError) {
    return <ErrorState onRetry={() => refetchStats()} />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="安全合规总览"
        description="统一管理 Agent 资产、检测任务与审计报告。重点能力：数据过度暴露检测、漏洞挖掘。"
        gradient
        actions={
          <>
            <Link href="/agents/new">
              <Button variant="outline">
                <Bot className="mr-1.5 h-4 w-4" />
                新建 Agent
              </Button>
            </Link>
            <Link href="/scans/new">
              <Button>
                <Scan className="mr-1.5 h-4 w-4" />
                发起检测
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card glass-card-hover overflow-hidden border-[#ff9146]/35">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Shield className="h-5 w-5 text-[#f27835]" />
                Agent 数据过度暴露检测
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>识别 PII、凭证、密钥、内部信息等敏感数据在工具调用链中的暴露风险。</p>
              <div className="rounded-xl border border-[#ff9146]/28 bg-[#ff9146]/10 p-3 text-xs text-[#b24f15]">
                覆盖范围：Prompt 输入、工具参数、上下文拼接、响应回流
              </div>
              <Link href="/scans/new?preset=exposure" className="inline-flex">
                <Button className="h-9">
                  进入检测
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card glass-card-hover overflow-hidden border-[#14a689]/35">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Bug className="h-5 w-5 text-[#0d7f69]" />
                Agent 漏洞挖掘
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>通过自动化攻击样本发现提示注入、越狱、工具滥用、污点传播等安全漏洞。</p>
              <div className="rounded-xl border border-[#14a689]/28 bg-[#14a689]/10 p-3 text-xs text-[#0d7f69]">
                支持强度分级与攻击类型组合，适配研发联调与上线前审计
              </div>
              <Link href="/scans/new?preset=fuzzing" className="inline-flex">
                <Button className="h-9">
                  进入挖掘
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {statsLoading ? (
        <LoadingSkeleton type="card" count={4} className="grid-cols-4" />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Agent 总数"
            value={stats?.agentCount ?? 0}
            description="已纳管的智能体资产"
            icon={Bot}
            tone="orange"
          />
          <MetricCard
            title="近 7 天任务"
            value={stats?.recentScanCount ?? 0}
            description="最近一周发起的检测"
            icon={Radar}
            tone="teal"
          />
          <MetricCard
            title="失败任务"
            value={stats?.failedScanCount ?? 0}
            description="建议优先复盘的任务"
            icon={AlertTriangle}
            tone="amber"
          />
          <MetricCard
            title="高风险报告"
            value={stats?.highRiskReportCount ?? 0}
            description="存在重大风险项"
            icon={FileText}
            tone="rose"
          />
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Scan className="h-5 w-5 text-[#f27835]" />
              最近检测任务
            </CardTitle>
            <Link href="/scans">
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {scansLoading ? (
              <LoadingSkeleton type="table" count={4} />
            ) : scans && scans.length > 0 ? (
              <div className="space-y-2">
                {scans.map((scan) => (
                  <Link
                    key={scan.id}
                    href={`/scans/${scan.id}`}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/80 bg-white/64 p-3 transition-colors hover:border-[#ff9146]/40 hover:bg-white/80"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <span className="font-mono">{shortId(scan.id)}</span>
                        <span className="text-xs text-slate-500">{scan.agentName || 'Unknown Agent'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {scan.types.map((type) => scanTypeLabels[type] || type).join(' / ')} · {formatDate(scan.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={scan.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无检测任务"
                description="创建任务后可在此实时查看状态。"
                action={{ label: '创建任务', href: '/scans/new' }}
              />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-[#0d7f69]" />
              最近审计报告
            </CardTitle>
            <Link href="/reports">
              <Button variant="ghost" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <LoadingSkeleton type="table" count={4} />
            ) : reports && reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/80 bg-white/64 p-3 transition-colors hover:border-[#14a689]/40 hover:bg-white/80"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-900">
                        <span className="font-mono">{shortId(report.id)}</span>
                        <span className="text-xs text-slate-500">{report.agentName || 'Unknown Agent'}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        发现 {report.summary.totalFindings} 项 · {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <RiskBadge risk={report.risk} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="暂无报告" description="完成检测后将自动生成审计报告。" />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

