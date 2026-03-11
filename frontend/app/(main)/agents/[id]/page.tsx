'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scan, Edit, Trash2, ArrowRight, Globe, Upload, Activity, TrendingUp, Shield, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KeyValueGrid } from '@/components/common/key-value-grid'
import { StatusBadge } from '@/components/badges/status-badge'
import { RiskBadge } from '@/components/badges/risk-badge'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { getAgent, listScans, listReports, deleteAgent } from '@/lib/api'
import { formatDate, shortId } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const agentId = params.id as string
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: agent, isLoading, error, refetch } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  })

  const { data: scans } = useQuery({
    queryKey: ['agentScans', agentId],
    queryFn: () => listScans({ agentId }),
    select: (data) => data.slice(0, 5),
  })

  const { data: reports } = useQuery({
    queryKey: ['agentReports', agentId],
    queryFn: () => listReports({ agentId }),
    select: (data) => data.slice(0, 3),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      toast.success('Agent 删除成功')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      router.push('/agents')
    },
    onError: () => {
      toast.error('删除失败，请重试')
    },
  })

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !agent) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const infoItems = [
    { label: '名称', value: agent.name },
    { label: '版本', value: agent.version || '-' },
    { label: '类型', value: agent.inputType === 'endpoint' ? 'Endpoint' : '规格上传' },
    { label: '创建时间', value: formatDate(agent.createdAt) },
    { label: '更新时间', value: formatDate(agent.updatedAt) },
    { label: '最后扫描', value: agent.lastScanAt ? formatDate(agent.lastScanAt) : '-' },
    ...(agent.inputType === 'endpoint'
      ? [
          { label: 'Endpoint', value: agent.endpointUrl || '-' },
          { label: '认证方式', value: agent.authType || 'none' },
        ]
      : [{ label: '规格文件', value: agent.specFilename || '-' }]),
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title={agent.name}
        description={agent.description || '智能体详情'}
        gradient
        breadcrumbs={[
          { title: 'Agent管理', href: '/agents' },
          { title: agent.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Link href={`/scans/new?agentId=${agentId}`}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="h-11 px-5">
                  <Zap className="h-4 w-4 mr-2" />
                  发起检测
                </Button>
              </motion.div>
            </Link>
            <Link href={`/agents/${agentId}/edit`}>
              <Button variant="outline" className="h-11 px-5 neon-button">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="h-11 px-5">
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </div>
        }
      />

      {/* Info Card */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6 glass-card glass-card-hover overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
              {agent.inputType === 'endpoint' ? (
                <Globe className="h-6 w-6 text-[#f27835]" />
              ) : (
                <Upload className="h-6 w-6 text-[#0d7f69]" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="font-display text-xl">基本信息</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Agent Configuration</p>
            </div>
            {agent.tags && agent.tags.length > 0 && (
              <div className="flex gap-2">
                {agent.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <KeyValueGrid items={infoItems} columns={3} />

            <div className="mt-8 pt-6 border-t border-white/80 grid grid-cols-2 gap-6">
              <motion.div
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 group hover:border-cyan-500/40 transition-colors"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-[#f27835]" />
                </div>
                    <div className="text-3xl font-bold font-display text-slate-900">{agent.toolCount || 0}</div>
                <div className="text-sm text-slate-500 mt-1">工具总数</div>
              </motion.div>
              <motion.div
                className={`text-center p-6 rounded-2xl border group transition-colors ${
                  agent.highRiskToolCount
                    ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40'
                    : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                }`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className={`h-5 w-5 ${agent.highRiskToolCount ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
                <div className={`text-3xl font-bold font-display ${agent.highRiskToolCount ? 'text-red-400' : 'text-emerald-400'}`}>
                  {agent.highRiskToolCount || 0}
                </div>
                <div className="text-sm text-slate-500 mt-1">高风险工具</div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Scans & Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Scans */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card glass-card-hover overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  <Scan className="h-5 w-5 text-[#f27835]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">最近任务</CardTitle>
                  <p className="text-xs text-slate-500">Recent Scan Tasks</p>
                </div>
              </div>
              <Link href={`/scans?agentId=${agentId}`}>
                <Button variant="ghost" size="sm" className="group">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {!scans || scans.length === 0 ? (
                <EmptyState
                  title="暂无任务"
                  action={{ label: '发起检测', href: `/scans/new?agentId=${agentId}` }}
                />
              ) : (
                <div className="space-y-3">
                  {scans.map((scan, index) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/scans/${scan.id}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/62 hover:bg-white/80 border border-transparent hover:border-cyan-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/62 group-hover:bg-cyan-500/10 transition-colors">
                            <Activity className="h-4 w-4 text-slate-500 group-hover:text-[#f27835] transition-colors" />
                          </div>
                          <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-[#f27835] transition-colors">
                              {shortId(scan.id)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(scan.createdAt)}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={scan.status} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reports */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card glass-card-hover overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <TrendingUp className="h-5 w-5 text-[#0d7f69]" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">最近报告</CardTitle>
                  <p className="text-xs text-slate-500">Recent Reports</p>
                </div>
              </div>
              <Link href={`/reports?agentId=${agentId}`}>
                <Button variant="ghost" size="sm" className="group">
                  查看全部
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {!reports || reports.length === 0 ? (
                <EmptyState title="暂无报告" />
              ) : (
                <div className="space-y-3">
                  {reports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/reports/${report.id}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/62 hover:bg-white/80 border border-transparent hover:border-purple-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/62 group-hover:bg-purple-500/10 transition-colors">
                            <TrendingUp className="h-4 w-4 text-slate-500 group-hover:text-[#0d7f69] transition-colors" />
                          </div>
                          <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-[#0d7f69] transition-colors">
                              {shortId(report.id)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDate(report.createdAt)} · {report.summary.totalFindings} 个发现
                            </div>
                          </div>
                        </div>
                        <RiskBadge risk={report.risk} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除 Agent"
        description={`确定要删除 "${agent.name}" 吗？此操作无法撤销，相关的检测任务和报告不会被删除。`}
        confirmLabel="删除"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(agentId)}
      />
    </motion.div>
  )
}

