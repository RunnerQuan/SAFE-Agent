'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Eye, FileText, RotateCcw, StopCircle, Scan, Activity, Zap, Clock, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { EmptyState } from '@/components/common/empty-state'
import { StatusBadge } from '@/components/badges/status-badge'
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog'
import { listScans, cancelScan } from '@/lib/api'
import { formatDate, formatDuration, shortId, scanTypeLabels } from '@/lib/utils'
import { Scan as ScanType } from '@/lib/types'

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

function ScansContent() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agentId')
  const queryClient = useQueryClient()
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; scan: ScanType | null }>({
    open: false,
    scan: null,
  })

  const { data: scans, isLoading, error, refetch } = useQuery({
    queryKey: ['scans', agentId],
    queryFn: () => listScans(agentId ? { agentId } : undefined),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.some((s) => s.status === 'queued' || s.status === 'running')) {
        return 3000
      }
      return false
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelScan,
    onSuccess: () => {
      toast.success('任务已取消')
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      setCancelDialog({ open: false, scan: null })
    },
    onError: () => {
      toast.error('取消失败，请重试')
    },
  })

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
        title="检测任务"
        description="查看和管理所有检测任务，监控检测进度"
        gradient
        actions={
          <Link href="/scans/new">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="h-11 px-5">
                <Zap className="h-4 w-4 mr-2" />
                新建任务
              </Button>
            </motion.div>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : scans?.length === 0 ? (
        <Card className="glass-card">
          <EmptyState
            title="暂无检测任务"
            description="创建检测任务以开始安全扫描"
            action={{ label: '新建任务', href: '/scans/new' }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {scans?.map((scan, index) => (
            <motion.div
              key={scan.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card glass-card-hover overflow-hidden group">
                {/* Running indicator */}
                {scan.status === 'running' && (
                  <div className="absolute top-0 left-0 right-0 h-px">
                    <div className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Left section */}
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                        scan.status === 'running'
                          ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/30'
                          : scan.status === 'succeeded'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/30'
                          : scan.status === 'failed'
                          ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}>
                        {scan.status === 'running' ? (
                          <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
                        ) : (
                          <Scan className="h-5 w-5 text-white/60" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {shortId(scan.id)}
                          </span>
                          <StatusBadge status={scan.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5" />
                            {scan.agentName || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(scan.createdAt)}
                          </span>
                          {scan.durationMs && (
                            <span className="text-white/40">
                              耗时: {formatDuration(scan.durationMs)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center section - Types */}
                    <div className="hidden md:flex items-center gap-2">
                      {scan.types.map((type) => (
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
                      <Link href={`/scans/${scan.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-cyan-500/10 hover:text-cyan-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {scan.status === 'succeeded' && scan.reportId && (
                        <Link href={`/reports/${scan.reportId}`}>
                          <Button variant="ghost" size="sm" className="hover:bg-emerald-500/10 hover:text-emerald-400">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/scans/new?agentId=${scan.agentId}&copyFrom=${scan.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-purple-500/10 hover:text-purple-400">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </Link>
                      {(scan.status === 'queued' || scan.status === 'running') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelDialog({ open: true, scan })}
                          className="hover:bg-amber-500/10 hover:text-amber-400"
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, scan: cancelDialog.scan })}
        title="取消任务"
        description="确定要取消这个检测任务吗？"
        confirmLabel="取消任务"
        variant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelDialog.scan) {
            cancelMutation.mutate(cancelDialog.scan.id)
          }
        }}
      />
    </motion.div>
  )
}

export default function ScansPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="table" count={5} />}>
      <ScansContent />
    </Suspense>
  )
}
