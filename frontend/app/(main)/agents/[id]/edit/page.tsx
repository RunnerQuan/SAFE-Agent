'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { ErrorState } from '@/components/common/error-state'
import { getAgent, updateAgent } from '@/lib/api'

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const agentId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    tags: '',
    endpointUrl: '',
    authType: 'none' as 'none' | 'api_key' | 'bearer',
  })

  const { data: agent, isLoading, error, refetch } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => getAgent(agentId),
  })

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        version: agent.version || '',
        description: agent.description || '',
        tags: agent.tags?.join(', ') || '',
        endpointUrl: agent.endpointUrl || '',
        authType: agent.authType || 'none',
      })
    }
  }, [agent])

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      updateAgent(agentId, {
        name: data.name,
        version: data.version || undefined,
        description: data.description || undefined,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : undefined,
        endpointUrl: data.endpointUrl || undefined,
        authType: data.authType,
      }),
    onSuccess: () => {
      toast.success('Agent 更新成功')
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      router.push(`/agents/${agentId}`)
    },
    onError: () => {
      toast.error('更新失败，请重试')
    },
  })

  if (isLoading) {
    return <LoadingSkeleton type="detail" />
  }

  if (error || !agent) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('请输入 Agent 名称')
      return
    }
    updateMutation.mutate(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title={`编辑 ${agent.name}`}
        breadcrumbs={[
          { title: 'Agent管理', href: '/agents' },
          { title: agent.name, href: `/agents/${agentId}` },
          { title: '编辑' },
        ]}
      />

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  placeholder="输入 Agent 名称"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">版本</Label>
                <Input
                  id="version"
                  placeholder="例如: 1.0.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="描述这个智能体的用途..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                placeholder="用逗号分隔，例如: 对话, GPT, 通用"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            {agent.inputType === 'endpoint' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="endpointUrl">Endpoint URL</Label>
                  <Input
                    id="endpointUrl"
                    placeholder="https://api.example.com/agent"
                    value={formData.endpointUrl}
                    onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authType">认证方式</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, authType: v as 'none' | 'api_key' | 'bearer' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无需认证</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => router.push(`/agents/${agentId}`)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存修改
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
