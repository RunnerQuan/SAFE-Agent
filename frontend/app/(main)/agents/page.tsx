'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Trash2, Edit, Scan, Eye, Bot, Globe, Upload, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { listAgents, deleteAgent } from '@/lib/api'
import { formatDate, shortId } from '@/lib/utils'
import { Agent } from '@/lib/types'

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

export default function AgentsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; agent: Agent | null }>({
    open: false,
    agent: null,
  })

  const { data: agents, isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      toast.success('Agent 删除成功')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      setDeleteDialog({ open: false, agent: null })
    },
    onError: () => {
      toast.error('删除失败，请重试')
    },
  })

  const filteredAgents = agents?.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  )

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
        title="Agent 管理"
        description="管理您的智能体应用，配置检测目标"
        gradient
        actions={
          <Link href="/agents/new">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="h-11 px-5">
                <Plus className="h-4 w-4 mr-2" />
                新建 Agent
              </Button>
            </motion.div>
          </Link>
        }
      />

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400/60" />
          <Input
            placeholder="搜索名称或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 bg-white/5 border-white/10 focus:border-cyan-500/50 rounded-xl"
          />
        </div>
      </motion.div>

      {/* Agent Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAgents?.length === 0 ? (
        <Card className="glass-card">
          <EmptyState
            title="暂无 Agent"
            description="创建您的第一个智能体以开始安全检测"
            action={{ label: '新建 Agent', href: '/agents/new' }}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents?.map((agent, index) => (
            <motion.div
              key={agent.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card glass-card-hover group overflow-hidden">
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                        {agent.inputType === 'endpoint' ? (
                          <Globe className="h-5 w-5 text-cyan-400" />
                        ) : (
                          <Upload className="h-5 w-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-white/40">
                          {agent.inputType === 'endpoint' ? 'Endpoint 接入' : '规格上传'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-white/5">
                      v{agent.version || '1.0'}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {agent.tags && agent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/20 text-purple-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <div className="text-lg font-bold font-display text-white">{agent.toolCount || 0}</div>
                      <div className="text-xs text-white/40">工具数量</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                      <div className={`text-lg font-bold font-display ${agent.highRiskToolCount ? 'text-red-400' : 'text-emerald-400'}`}>
                        {agent.highRiskToolCount || 0}
                      </div>
                      <div className="text-xs text-white/40">高风险工具</div>
                    </div>
                  </div>

                  {/* Last scan */}
                  <div className="text-xs text-white/40 mb-4">
                    最后扫描: {agent.lastScanAt ? formatDate(agent.lastScanAt) : '从未扫描'}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/agents/${agent.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full neon-button">
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    </Link>
                    <Link href={`/scans/new?agentId=${agent.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        <Scan className="h-4 w-4 mr-1" />
                        检测
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleteDialog({ open: true, agent })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, agent: deleteDialog.agent })}
        title="删除 Agent"
        description={`确定要删除 "${deleteDialog.agent?.name}" 吗？此操作无法撤销。`}
        confirmLabel="删除"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteDialog.agent) {
            deleteMutation.mutate(deleteDialog.agent.id)
          }
        }}
      />
    </motion.div>
  )
}
