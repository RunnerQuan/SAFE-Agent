'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bot,
  Scan,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  Activity,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/badges/status-badge'
import { RiskBadge } from '@/components/badges/risk-badge'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { EmptyState } from '@/components/common/empty-state'
import { getDashboardStats, listScans, listReports } from '@/lib/api'
import { formatDate, shortId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

// 优化：减少stagger延迟，加快页面渲染
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 从0.1减少到0.05
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 }, // 减少位移距离
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }, // 缩短动画时间
}

// Enhanced StatCard component
function EnhancedStatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'cyan',
  index = 0,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  color?: 'cyan' | 'purple' | 'pink' | 'amber' | 'red' | 'emerald'
  index?: number
}) {
  const colorClasses = {
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      icon: 'text-cyan-400 bg-cyan-500/10',
      glow: 'hover:shadow-cyan-500/20',
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'text-purple-400 bg-purple-500/10',
      glow: 'hover:shadow-purple-500/20',
    },
    pink: {
      bg: 'from-pink-500/20 to-pink-500/5',
      border: 'border-pink-500/20 hover:border-pink-500/40',
      icon: 'text-pink-400 bg-pink-500/10',
      glow: 'hover:shadow-pink-500/20',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      icon: 'text-amber-400 bg-amber-500/10',
      glow: 'hover:shadow-amber-500/20',
    },
    red: {
      bg: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/20 hover:border-red-500/40',
      icon: 'text-red-400 bg-red-500/10',
      glow: 'hover:shadow-red-500/20',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'text-emerald-400 bg-emerald-500/10',
      glow: 'hover:shadow-emerald-500/20',
    },
  }

  const classes = colorClasses[color]

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={cn(
        'relative group rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300',
        classes.bg,
        classes.border,
        `hover:shadow-2xl ${classes.glow}`
      )}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-2xl shimmer opacity-0 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/60">{title}</p>
          <motion.p
            className="mt-3 text-4xl font-bold font-display text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
          >
            {value}
          </motion.p>
          {description && (
            <p className="mt-2 text-xs text-white/40">{description}</p>
          )}
        </div>
        <motion.div
          className={cn('rounded-xl p-3', classes.icon)}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>

      {/* Activity indicator - 使用CSS动画替代Framer Motion */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <Activity className="h-3 w-3 text-white/20" />
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-white/20 animate-activity-bar"
              style={{
                height: `${8 + (i * 3) % 12}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  })

  const { data: recentScans, isLoading: scansLoading } = useQuery({
    queryKey: ['recentScans'],
    queryFn: () => listScans(),
    select: (data) => data.slice(0, 5),
  })

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['recentReports'],
    queryFn: () => listReports(),
    select: (data) => data.slice(0, 5),
  })

  if (statsError) {
    return <ErrorState onRetry={() => refetchStats()} />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 p-8"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 animate-shield-glow">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-cyan-500 to-purple-500" />
                <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                  控制台概览
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text-animated">欢迎使用</span>
                <br />
                <span className="text-white">安全检测平台</span>
              </h1>

              <p className="text-white/60 text-lg mb-6 leading-relaxed">
                智能检测 AI Agent 安全风险，保护您的智能体应用免受攻击。
                <br />
                支持数据暴露检测、漏洞挖掘、风险评估等多种安全检测能力。
              </p>

              <div className="flex gap-4">
                <Link href="/agents/new">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="h-12 px-6 font-medium">
                      <Plus className="h-5 w-5 mr-2" />
                      新建 Agent
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/scans/new">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" variant="outline" className="h-12 px-6 font-medium neon-button">
                      <Zap className="h-5 w-5 mr-2" />
                      发起检测
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>

            {/* AI图标圆环装饰组件 */}
            <div className="hidden xl:block">
              <div className="relative w-72 h-72">
                {/* 外层圆环 - CSS动画旋转 */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-orbit-slow" />
                <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-orbit-medium" />
                <div className="absolute inset-8 rounded-full border border-pink-500/20 animate-orbit-fast" />

                {/* AI图标 - 沿圆环分布 */}
                {/* ChatGPT */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 animate-orbit-icon" style={{ animationDelay: '0s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#10a37f]/20 border border-[#10a37f]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5 text-[#10a37f]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ChatGPT</span>
                  </div>
                </div>

                {/* Google Gemini */}
                <div className="absolute top-1/4 right-0 translate-x-1 animate-orbit-icon" style={{ animationDelay: '-2s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#4285f4]/20 border border-[#4285f4]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4285f4"/>
                          <stop offset="50%" stopColor="#9b72cb"/>
                          <stop offset="100%" stopColor="#d96570"/>
                        </linearGradient>
                      </defs>
                      <path fill="url(#gemini-grad)" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Gemini</span>
                  </div>
                </div>

                {/* DeepSeek */}
                <div className="absolute bottom-1/4 right-0 translate-x-1 animate-orbit-icon" style={{ animationDelay: '-4s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#5b6ee1]/20 border border-[#5b6ee1]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5 text-[#5b6ee1]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">DeepSeek</span>
                  </div>
                </div>

                {/* Claude */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 animate-orbit-icon" style={{ animationDelay: '-6s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#cc785c]/20 border border-[#cc785c]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5 text-[#cc785c]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Claude</span>
                  </div>
                </div>

                {/* LangChain Agent */}
                <div className="absolute bottom-1/4 left-0 -translate-x-1 animate-orbit-icon" style={{ animationDelay: '-8s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/20 border border-[#3ECF8E]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5 text-[#3ECF8E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">LangChain</span>
                  </div>
                </div>

                {/* AutoGPT */}
                <div className="absolute top-1/4 left-0 -translate-x-1 animate-orbit-icon" style={{ animationDelay: '-10s' }}>
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center backdrop-blur-sm hover:scale-110 transition-transform cursor-pointer group">
                    <svg className="w-5 h-5 text-[#8B5CF6]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4-9h-3V8a1 1 0 0 0-2 0v3H8a1 1 0 0 0 0 2h3v3a1 1 0 0 0 2 0v-3h3a1 1 0 0 0 0-2z"/>
                    </svg>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AutoGPT</span>
                  </div>
                </div>

                {/* 中心装饰 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-cyan-400/60" />
                  </div>
                </div>

                {/* 发光点 */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse-glow" style={{ boxShadow: '0 0 15px rgba(34, 211, 238, 0.6)' }} />
                <div className="absolute top-0 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse-glow" style={{ animationDelay: '1s', boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <LoadingSkeleton type="card" count={4} className="grid-cols-4" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <EnhancedStatCard
            title="Agent 总数"
            value={stats?.agentCount || 0}
            icon={Bot}
            description="已注册的智能体"
            color="cyan"
            index={0}
          />
          <EnhancedStatCard
            title="近7天任务"
            value={stats?.recentScanCount || 0}
            icon={Scan}
            description="最近一周的检测任务"
            color="purple"
            index={1}
          />
          <EnhancedStatCard
            title="失败任务"
            value={stats?.failedScanCount || 0}
            icon={AlertTriangle}
            description="需要关注的失败任务"
            color={stats?.failedScanCount ? 'amber' : 'emerald'}
            index={2}
          />
          <EnhancedStatCard
            title="高风险报告"
            value={stats?.highRiskReportCount || 0}
            icon={FileText}
            description="发现高风险问题的报告"
            color={stats?.highRiskReportCount ? 'red' : 'emerald'}
            index={3}
          />
        </div>
      )}

      {/* Recent Scans & Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Scans */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card glass-card-hover overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  <Scan className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">最近任务</CardTitle>
                  <p className="text-xs text-white/40">Recent Scan Tasks</p>
                </div>
              </div>
              <Link href="/scans">
                <Button variant="ghost" size="sm" className="group">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {scansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentScans?.length === 0 ? (
                <EmptyState
                  title="暂无任务"
                  description="开始创建您的第一个检测任务"
                  action={{ label: '发起检测', href: '/scans/new' }}
                />
              ) : (
                <div className="space-y-3">
                  {recentScans?.map((scan, index) => (
                    <div
                      key={scan.id}
                      className="animate-list-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Link
                        href={`/scans/${scan.id}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-cyan-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                            <Activity className="h-5 w-5 text-white/60 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {scan.agentName || shortId(scan.id)}
                            </div>
                            <div className="text-xs text-white/40">
                              {formatDate(scan.createdAt)}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={scan.status} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reports */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card glass-card-hover overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">最近报告</CardTitle>
                  <p className="text-xs text-white/40">Recent Reports</p>
                </div>
              </div>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="group">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {reportsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentReports?.length === 0 ? (
                <EmptyState
                  title="暂无报告"
                  description="完成检测任务后将生成报告"
                />
              ) : (
                <div className="space-y-3">
                  {recentReports?.map((report, index) => (
                    <div
                      key={report.id}
                      className="animate-list-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Link
                        href={`/reports/${report.id}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 group-hover:bg-purple-500/10 transition-colors">
                            <TrendingUp className="h-5 w-5 text-white/60 group-hover:text-purple-400 transition-colors" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                              {report.agentName || shortId(report.id)}
                            </div>
                            <div className="text-xs text-white/40">
                              {formatDate(report.createdAt)} · {report.summary.totalFindings} 个发现
                            </div>
                          </div>
                        </div>
                        <RiskBadge risk={report.risk} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
