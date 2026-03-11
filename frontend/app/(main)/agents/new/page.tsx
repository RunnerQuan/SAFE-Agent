'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Upload, Globe, Loader2, CheckCircle, XCircle, Bot, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAgent, testConnection } from '@/lib/api'
import { AgentInputType } from '@/lib/types'

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

export default function NewAgentPage() {
  const router = useRouter()
  const [inputType, setInputType] = useState<AgentInputType>('endpoint')
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    tags: '',
    endpointUrl: '',
    authType: 'none' as 'none' | 'api_key' | 'bearer',
    apiKey: '',
    specFile: null as File | null,
  })
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: (agent) => {
      toast.success('Agent 创建成功')
      router.push(`/agents/${agent.id}`)
    },
    onError: () => {
      toast.error('创建失败，请重试')
    },
  })

  const handleTestConnection = async () => {
    if (!formData.endpointUrl) {
      toast.error('请输入 Endpoint URL')
      return
    }
    setConnectionStatus('testing')
    try {
      const success = await testConnection(formData.endpointUrl, formData.authType, formData.apiKey)
      setConnectionStatus(success ? 'success' : 'failed')
      toast[success ? 'success' : 'error'](success ? '连接测试成功' : '连接测试失败')
    } catch {
      setConnectionStatus('failed')
      toast.error('连接测试失败')
    }
  }

  const handleSubmit = (startScan: boolean = false) => {
    if (!formData.name.trim()) {
      toast.error('请输入 Agent 名称')
      return
    }

    if (inputType === 'endpoint' && !formData.endpointUrl.trim()) {
      toast.error('请输入 Endpoint URL')
      return
    }

    if (inputType === 'spec_upload' && !formData.specFile) {
      toast.error('请上传规格文件')
      return
    }

    const payload = {
      name: formData.name,
      version: formData.version || undefined,
      description: formData.description || undefined,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : undefined,
      inputType,
      endpointUrl: inputType === 'endpoint' ? formData.endpointUrl : undefined,
      authType: inputType === 'endpoint' ? formData.authType : undefined,
      specFilename: inputType === 'spec_upload' && formData.specFile ? formData.specFile.name : undefined,
    }

    createMutation.mutate(payload, {
      onSuccess: (agent) => {
        if (startScan) {
          router.push(`/scans/new?agentId=${agent.id}`)
        } else {
          router.push(`/agents/${agent.id}`)
        }
      },
    })
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="新建 Agent"
        description="创建一个新的智能体进行安全检测"
        gradient
        breadcrumbs={[
          { title: 'Agent管理', href: '/agents' },
          { title: '新建 Agent' },
        ]}
      />

      <div className="max-w-3xl">
        <motion.div variants={itemVariants}>
          <Tabs value={inputType} onValueChange={(v) => setInputType(v as AgentInputType)}>
            <TabsList className="mb-6 p-1 bg-white/62 border border-white/80 rounded-xl">
              <TabsTrigger value="endpoint" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-cyan-500/30 rounded-lg">
                <Globe className="h-4 w-4" />
                Endpoint 接入
              </TabsTrigger>
              <TabsTrigger value="spec_upload" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-cyan-500/30 rounded-lg">
                <Upload className="h-4 w-4" />
                规格上传
              </TabsTrigger>
            </TabsList>

            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                    <Bot className="h-5 w-5 text-[#f27835]" />
                  </div>
                  <div>
                    <CardTitle className="font-display">基本信息</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">配置智能体的基本属性</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">名称 *</Label>
                    <Input
                      id="name"
                      placeholder="输入 Agent 名称"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-11 bg-white/62 border-white/80 focus:border-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version" className="text-slate-700">版本</Label>
                    <Input
                      id="version"
                      placeholder="例如: 1.0.0"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="h-11 bg-white/62 border-white/80 focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-700">描述</Label>
                  <Textarea
                    id="description"
                    placeholder="描述这个智能体的用途..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] bg-white/62 border-white/80 focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-slate-700">标签</Label>
                  <Input
                    id="tags"
                    placeholder="用逗号分隔，例如: 对话, GPT, 通用"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="h-11 bg-white/62 border-white/80 focus:border-cyan-500/50"
                  />
                </div>
              </CardContent>
            </Card>

            <TabsContent value="endpoint">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mt-4 glass-card overflow-hidden">
                  <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
                        <Globe className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="font-display">Endpoint 配置</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">配置 API 端点和认证信息</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="endpointUrl" className="text-slate-700">Endpoint URL *</Label>
                      <Input
                        id="endpointUrl"
                        placeholder="https://api.example.com/agent"
                        value={formData.endpointUrl}
                        onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                        className="h-11 bg-white/62 border-white/80 focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="authType" className="text-slate-700">认证方式</Label>
                        <Select
                          value={formData.authType}
                          onValueChange={(v) => setFormData({ ...formData, authType: v as 'none' | 'api_key' | 'bearer' })}
                        >
                          <SelectTrigger className="h-11 bg-white/62 border-white/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">无需认证</SelectItem>
                            <SelectItem value="api_key">API Key</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.authType !== 'none' && (
                        <div className="space-y-2">
                          <Label htmlFor="apiKey" className="text-slate-700">
                            {formData.authType === 'api_key' ? 'API Key' : 'Bearer Token'}
                          </Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="输入密钥..."
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="h-11 bg-white/62 border-white/80 focus:border-cyan-500/50"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={connectionStatus === 'testing'}
                        className="neon-button"
                      >
                        {connectionStatus === 'testing' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Zap className="h-4 w-4 mr-2" />
                        测试连通性
                      </Button>
                      {connectionStatus === 'success' && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center text-sm text-emerald-400"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          连接成功
                        </motion.span>
                      )}
                      {connectionStatus === 'failed' && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center text-sm text-red-400"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          连接失败
                        </motion.span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="spec_upload">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mt-4 glass-card overflow-hidden">
                  <CardHeader className="border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                        <Upload className="h-5 w-5 text-[#0d7f69]" />
                      </div>
                      <div>
                        <CardTitle className="font-display">规格文件上传</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">上传 Agent 规格定义文件</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <motion.div
                      className="border-2 border-dashed border-white/80 rounded-2xl p-10 text-center hover:border-purple-500/40 hover:bg-purple-500/5 transition-all cursor-pointer group"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <input
                        type="file"
                        accept=".yaml,.yml,.json,.zip"
                        className="hidden"
                        id="spec-file"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData({ ...formData, specFile: file })
                            toast.success(`已选择文件: ${file.name}`)
                          }
                        }}
                      />
                      <label htmlFor="spec-file" className="cursor-pointer">
                        <motion.div
                          className="flex h-16 w-16 items-center justify-center mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 mb-4 group-hover:border-purple-500/40"
                          whileHover={{ rotate: 5 }}
                        >
                          <Upload className="h-8 w-8 text-[#0d7f69]" />
                        </motion.div>
                        <p className="text-base text-slate-600 mb-2 font-medium">
                          点击或拖拽上传 Agent 规格文件
                        </p>
                        <p className="text-sm text-slate-500">
                          支持 YAML、JSON、ZIP 格式
                        </p>
                      </label>
                      {formData.specFile && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#0d7f69]" />
                            <span className="text-sm text-purple-300">
                              已选择: {formData.specFile.name}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="flex justify-end gap-3 mt-8"
        >
          <Button variant="outline" onClick={() => router.push('/agents')} className="h-11 px-5">
            取消
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={createMutation.isPending}
            className="h-11 px-5"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => handleSubmit(true)} disabled={createMutation.isPending} className="h-11 px-5">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Zap className="h-4 w-4 mr-2" />
              保存并发起检测
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

