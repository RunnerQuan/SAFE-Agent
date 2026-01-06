'use client'

import { useState, useEffect, Suspense } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Zap, Shield, Bug, Bot, Sparkles, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { listAgents, getScan, createScan } from '@/lib/api'

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

const dataTypeOptions = [
  { id: 'pii', label: 'PII (个人身份信息)', description: '姓名、身份证、电话等' },
  { id: 'credential', label: 'Credential (凭证信息)', description: '密码、令牌等' },
  { id: 'secrets', label: 'Secrets (密钥)', description: 'API Key、私钥等' },
  { id: 'internal', label: 'Internal (内部信息)', description: '内部系统信息' },
]

const attackTypeOptions = [
  { id: 'prompt_injection', label: '提示注入', description: '检测提示注入漏洞' },
  { id: 'jailbreak', label: '越狱攻击', description: '检测越狱攻击风险' },
  { id: 'taint_style', label: '污点攻击', description: '检测数据污染风险' },
  { id: 'tool_abuse', label: '工具滥用', description: '检测工具滥用风险' },
]

export default function NewScanPage() {
  return (
    <Suspense fallback={<LoadingSkeleton type="detail" />}>
      <NewScanContent />
    </Suspense>
  )
}

function NewScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentIdParam = searchParams.get('agentId')
  const copyFromParam = searchParams.get('copyFrom')

  const [formData, setFormData] = useState({
    agentId: agentIdParam || '',
    types: [] as string[],
    exposureDataTypes: ['pii', 'credential'],
    fuzzingIntensity: 'standard' as 'light' | 'standard' | 'strong',
    fuzzingAttackTypes: ['prompt_injection', 'jailbreak'],
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
  })

  const { data: copyScan } = useQuery({
    queryKey: ['scan', copyFromParam],
    queryFn: () => getScan(copyFromParam!),
    enabled: !!copyFromParam,
  })

  useEffect(() => {
    if (copyScan) {
      setFormData((prev) => ({
        ...prev,
        agentId: copyScan.agentId,
        types: copyScan.types,
        ...(copyScan.params as object),
      }))
    }
  }, [copyScan])

  const createMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      toast.success('检测任务已提交')
      router.push(`/scans/${scan.id}`)
    },
    onError: () => {
      toast.error('提交失败，请重试')
    },
  })

  const handleTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }))
  }

  const handleSubmit = () => {
    if (!formData.agentId) {
      toast.error('请选择 Agent')
      return
    }
    if (formData.types.length === 0) {
      toast.error('请选择至少一种检测类型')
      return
    }

    const params: Record<string, unknown> = {}
    if (formData.types.includes('exposure')) {
      params.exposureDataTypes = formData.exposureDataTypes
    }
    if (formData.types.includes('fuzzing')) {
      params.fuzzingIntensity = formData.fuzzingIntensity
      params.fuzzingAttackTypes = formData.fuzzingAttackTypes
    }

    createMutation.mutate({
      agentId: formData.agentId,
      types: formData.types,
      params,
    })
  }

  if (agentsLoading) {
    return <LoadingSkeleton type="detail" />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="新建检测任务"
        description="配置并发起安全检测"
        gradient
        breadcrumbs={[
          { title: '检测任务', href: '/scans' },
          { title: '新建任务' },
        ]}
      />

      <div className="max-w-3xl space-y-6">
        {/* Select Agent */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                  <Bot className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="font-display">选择 Agent</CardTitle>
                  <CardDescription>选择要检测的智能体</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Select
                value={formData.agentId}
                onValueChange={(v) => setFormData({ ...formData, agentId: v })}
              >
                <SelectTrigger className="w-full h-12 bg-white/5 border-white/10">
                  <SelectValue placeholder="选择 Agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-cyan-400" />
                        {agent.name}
                        {agent.version && <span className="text-white/40">(v{agent.version})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scan Types */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="font-display">检测类型</CardTitle>
                  <CardDescription>选择要执行的检测类型</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Exposure */}
                <motion.div
                  className={`relative rounded-2xl border p-5 cursor-pointer transition-all group ${
                    formData.types.includes('exposure')
                      ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  onClick={() => handleTypeToggle('exposure')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {formData.types.includes('exposure') && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-cyan-400" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      formData.types.includes('exposure')
                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <Shield className={`h-6 w-6 ${formData.types.includes('exposure') ? 'text-cyan-400' : 'text-white/60'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-display font-semibold ${formData.types.includes('exposure') ? 'text-cyan-400' : 'text-white'}`}>
                        数据暴露检测
                      </div>
                      <div className="text-sm text-white/50 mt-1">
                        检测敏感数据泄露风险，包括PII、凭证、内部信息等
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Fuzzing */}
                <motion.div
                  className={`relative rounded-2xl border p-5 cursor-pointer transition-all group ${
                    formData.types.includes('fuzzing')
                      ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-purple-500/5'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  onClick={() => handleTypeToggle('fuzzing')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {formData.types.includes('fuzzing') && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-purple-400" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      formData.types.includes('fuzzing')
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <Bug className={`h-6 w-6 ${formData.types.includes('fuzzing') ? 'text-purple-400' : 'text-white/60'}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-display font-semibold ${formData.types.includes('fuzzing') ? 'text-purple-400' : 'text-white'}`}>
                        漏洞挖掘
                      </div>
                      <div className="text-sm text-white/50 mt-1">
                        通过模糊测试发现提示注入、越狱等安全漏洞
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Exposure Options */}
        {formData.types.includes('exposure') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass-card overflow-hidden border-cyan-500/20">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Shield className="h-5 w-5 text-cyan-400" />
                  </div>
                  <CardTitle className="font-display">数据暴露检测配置</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Label className="mb-4 block text-white/80">检测数据类型</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {dataTypeOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        formData.exposureDataTypes.includes(option.id)
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-white/5 border border-transparent hover:border-white/10'
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          exposureDataTypes: prev.exposureDataTypes.includes(option.id)
                            ? prev.exposureDataTypes.filter((t) => t !== option.id)
                            : [...prev.exposureDataTypes, option.id],
                        }))
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Checkbox
                        id={`data-${option.id}`}
                        checked={formData.exposureDataTypes.includes(option.id)}
                        className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div>
                        <Label htmlFor={`data-${option.id}`} className="font-medium cursor-pointer text-white">
                          {option.label}
                        </Label>
                        <p className="text-xs text-white/40">{option.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fuzzing Options */}
        {formData.types.includes('fuzzing') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="glass-card overflow-hidden border-purple-500/20">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30">
                    <Bug className="h-5 w-5 text-purple-400" />
                  </div>
                  <CardTitle className="font-display">漏洞挖掘配置</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label className="mb-4 block text-white/80">检测强度</Label>
                  <Select
                    value={formData.fuzzingIntensity}
                    onValueChange={(v) =>
                      setFormData({ ...formData, fuzzingIntensity: v as 'light' | 'standard' | 'strong' })
                    }
                  >
                    <SelectTrigger className="w-full max-w-xs h-11 bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">轻量 (快速扫描)</SelectItem>
                      <SelectItem value="standard">标准 (推荐)</SelectItem>
                      <SelectItem value="strong">强力 (深度扫描)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-4 block text-white/80">攻击类型</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {attackTypeOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          formData.fuzzingAttackTypes.includes(option.id)
                            ? 'bg-purple-500/10 border border-purple-500/30'
                            : 'bg-white/5 border border-transparent hover:border-white/10'
                        }`}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            fuzzingAttackTypes: prev.fuzzingAttackTypes.includes(option.id)
                              ? prev.fuzzingAttackTypes.filter((t) => t !== option.id)
                              : [...prev.fuzzingAttackTypes, option.id],
                          }))
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Checkbox
                          id={`attack-${option.id}`}
                          checked={formData.fuzzingAttackTypes.includes(option.id)}
                          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <div>
                          <Label htmlFor={`attack-${option.id}`} className="font-medium cursor-pointer text-white">
                            {option.label}
                          </Label>
                          <p className="text-xs text-white/40">{option.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => router.back()} className="h-11 px-5">
            取消
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="h-11 px-6">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Zap className="h-4 w-4 mr-2" />
              提交检测
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
