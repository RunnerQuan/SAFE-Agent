'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bot,
  Bug,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { createScan, getScan, listAgents } from '@/lib/api'
import { cn } from '@/lib/utils'

type FuzzingIntensity = 'light' | 'standard' | 'strong'

type ScanPreset = 'exposure' | 'fuzzing' | null

const dataTypeOptions = [
  { id: 'pii', label: 'PII 个人身份信息', description: '姓名、手机号、身份证号等敏感个人信息' },
  { id: 'credential', label: 'Credential 凭证信息', description: '账号密码、Session、访问令牌等' },
  { id: 'secrets', label: 'Secrets 密钥', description: 'API Key、私钥、数据库连接串等' },
  { id: 'internal', label: 'Internal 内部信息', description: '系统提示词、内部路径、私有接口等' },
] as const

const attackTypeOptions = [
  { id: 'prompt_injection', label: '提示注入', description: '通过恶意输入覆盖系统策略或约束' },
  { id: 'jailbreak', label: '越狱攻击', description: '绕过安全对齐策略生成越权行为' },
  { id: 'taint_style', label: '污点传播', description: '验证不可信输入是否影响关键执行路径' },
  { id: 'tool_abuse', label: '工具滥用', description: '诱导 Agent 非授权调用工具或接口' },
] as const

const intensityLabels: Record<FuzzingIntensity, string> = {
  light: '轻量（快速检查）',
  standard: '标准（推荐）',
  strong: '强力（深度挖掘）',
}

function detectPreset(value: string | null): ScanPreset {
  if (value === 'exposure' || value === 'fuzzing') return value
  return null
}

function getPresetTypes(preset: ScanPreset): string[] {
  if (preset === 'exposure') return ['exposure']
  if (preset === 'fuzzing') return ['fuzzing']
  return []
}

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
  const preset = detectPreset(searchParams.get('preset'))

  const [formData, setFormData] = useState({
    agentId: agentIdParam || '',
    types: getPresetTypes(preset),
    exposureDataTypes: ['pii', 'credential'] as string[],
    fuzzingIntensity: 'standard' as FuzzingIntensity,
    fuzzingAttackTypes: ['prompt_injection', 'jailbreak'] as string[],
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: listAgents,
  })

  const { data: copyScan } = useQuery({
    queryKey: ['scan', copyFromParam],
    queryFn: () => getScan(copyFromParam!),
    enabled: Boolean(copyFromParam),
  })

  useEffect(() => {
    if (copyScan) {
      setFormData((prev) => ({
        ...prev,
        agentId: copyScan.agentId,
        types: copyScan.types,
        ...(copyScan.params as object),
      }))
      return
    }

    setFormData((prev) => {
      const presetTypes = getPresetTypes(preset)
      if (presetTypes.length === 0) return prev
      return {
        ...prev,
        types: presetTypes,
      }
    })
  }, [copyScan, preset])

  const createMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      toast.success('检测任务已提交，正在进入执行队列')
      router.push(`/scans/${scan.id}`)
    },
    onError: () => {
      toast.error('提交失败，请稍后重试')
    },
  })

  const hasExposure = formData.types.includes('exposure')
  const hasFuzzing = formData.types.includes('fuzzing')

  const selectedAgentName = useMemo(
    () => agents?.find((agent) => agent.id === formData.agentId)?.name || '未选择',
    [agents, formData.agentId]
  )

  const toggleType = (type: 'exposure' | 'fuzzing') => {
    setFormData((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((item) => item !== type)
        : [...prev.types, type],
    }))
  }

  const toggleExposureDataType = (dataType: string) => {
    setFormData((prev) => ({
      ...prev,
      exposureDataTypes: prev.exposureDataTypes.includes(dataType)
        ? prev.exposureDataTypes.filter((item) => item !== dataType)
        : [...prev.exposureDataTypes, dataType],
    }))
  }

  const toggleAttackType = (attackType: string) => {
    setFormData((prev) => ({
      ...prev,
      fuzzingAttackTypes: prev.fuzzingAttackTypes.includes(attackType)
        ? prev.fuzzingAttackTypes.filter((item) => item !== attackType)
        : [...prev.fuzzingAttackTypes, attackType],
    }))
  }

  const handleSubmit = () => {
    if (!formData.agentId) {
      toast.error('请先选择一个 Agent')
      return
    }
    if (formData.types.length === 0) {
      toast.error('请至少选择一种检测类型')
      return
    }

    const params: Record<string, unknown> = {}
    if (hasExposure) {
      params.exposureDataTypes = formData.exposureDataTypes
    }
    if (hasFuzzing) {
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
    <div className="space-y-6">
      <PageHeader
        title="新建检测任务"
        description="为目标 Agent 选择检测策略并发起安全合规审计。"
        gradient
        breadcrumbs={[
          { title: '检测任务', href: '/scans' },
          { title: '新建任务' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="border-b border-white/70">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#f27835]" />
                目标 Agent
              </CardTitle>
              <CardDescription>选择需要执行检测的智能体实例</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Select
                value={formData.agentId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, agentId: value }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="选择 Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="border-b border-white/70">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                检测能力选择
              </CardTitle>
              <CardDescription>支持单选或组合执行两类检测能力</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => toggleType('exposure')}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 text-left transition-all',
                  hasExposure
                    ? 'border-sky-300/40 bg-sky-500/10'
                    : 'border-white/75 bg-white/66 hover:border-[#ff9146]/35'
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-300/30 bg-sky-500/10">
                    <Shield className="h-5 w-5 text-sky-200" />
                  </div>
                  {hasExposure && <CheckCircle2 className="h-5 w-5 text-sky-200" />}
                </div>
                <p className="font-medium text-slate-900">Agent 数据过度暴露检测</p>
                <p className="mt-1 text-xs text-slate-300/75">识别敏感数据在推理链和工具调用中的泄露风险</p>
              </button>

              <button
                type="button"
                onClick={() => toggleType('fuzzing')}
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 text-left transition-all',
                  hasFuzzing
                    ? 'border-emerald-300/40 bg-emerald-500/10'
                    : 'border-white/75 bg-white/66 hover:border-[#14a689]/35'
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-500/10">
                    <Bug className="h-5 w-5 text-emerald-200" />
                  </div>
                  {hasFuzzing && <CheckCircle2 className="h-5 w-5 text-emerald-200" />}
                </div>
                <p className="font-medium text-slate-900">Agent 漏洞挖掘</p>
                <p className="mt-1 text-xs text-slate-300/75">通过攻击样本挖掘提示注入、越狱与工具滥用风险</p>
              </button>
            </CardContent>
          </Card>

          {hasExposure && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card border-sky-300/25">
                <CardHeader className="border-b border-white/70">
                  <CardTitle className="flex items-center gap-2 text-sky-100">
                    <Shield className="h-5 w-5" />
                    数据暴露检测配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pt-6 md:grid-cols-2">
                  {dataTypeOptions.map((option) => (
                    <label
                      key={option.id}
                      htmlFor={option.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                        formData.exposureDataTypes.includes(option.id)
                          ? 'border-sky-300/35 bg-sky-500/10'
                          : 'border-white/75 bg-white/62 hover:border-[#ff9146]/35'
                      )}
                    >
                      <Checkbox
                        id={option.id}
                        checked={formData.exposureDataTypes.includes(option.id)}
                        onCheckedChange={() => toggleExposureDataType(option.id)}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor={option.id} className="cursor-pointer text-sm text-slate-900">
                          {option.label}
                        </Label>
                        <p className="mt-1 text-xs text-slate-300/75">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {hasFuzzing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card border-emerald-300/25">
                <CardHeader className="border-b border-white/70">
                  <CardTitle className="flex items-center gap-2 text-emerald-100">
                    <Bug className="h-5 w-5" />
                    漏洞挖掘配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">挖掘强度</Label>
                    <Select
                      value={formData.fuzzingIntensity}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          fuzzingIntensity: value as FuzzingIntensity,
                        }))
                      }
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{intensityLabels.light}</SelectItem>
                        <SelectItem value="standard">{intensityLabels.standard}</SelectItem>
                        <SelectItem value="strong">{intensityLabels.strong}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-200">攻击类型</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {attackTypeOptions.map((option) => (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
                            formData.fuzzingAttackTypes.includes(option.id)
                              ? 'border-emerald-300/35 bg-emerald-500/10'
                              : 'border-white/75 bg-white/62 hover:border-[#14a689]/35'
                          )}
                        >
                          <Checkbox
                            id={option.id}
                            checked={formData.fuzzingAttackTypes.includes(option.id)}
                            onCheckedChange={() => toggleAttackType(option.id)}
                            className="mt-1"
                          />
                          <div>
                            <Label htmlFor={option.id} className="cursor-pointer text-sm text-slate-900">
                              {option.label}
                            </Label>
                            <p className="mt-1 text-xs text-slate-300/75">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-1.5 h-4 w-4" />
              )}
              提交检测
            </Button>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-[#f27835]" />
                任务摘要
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-white/75 bg-white/66 p-3">
                <p className="text-xs text-slate-400">目标 Agent</p>
                <p className="mt-1 text-slate-900">{selectedAgentName}</p>
              </div>
              <div className="rounded-lg border border-white/75 bg-white/66 p-3">
                <p className="text-xs text-slate-400">检测类型</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hasExposure && (
                    <span className="rounded-full border border-sky-300/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-100">
                      数据暴露检测
                    </span>
                  )}
                  {hasFuzzing && (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                      漏洞挖掘
                    </span>
                  )}
                  {!hasExposure && !hasFuzzing && (
                    <span className="text-xs text-slate-400">尚未选择</span>
                  )}
                </div>
              </div>
              {hasFuzzing && (
                <div className="rounded-lg border border-white/75 bg-white/66 p-3">
                  <p className="text-xs text-slate-400">挖掘强度</p>
                  <p className="mt-1 text-slate-900">{intensityLabels[formData.fuzzingIntensity]}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-sky-300/20">
            <CardContent className="p-4 text-xs text-slate-600">
              建议先执行“数据暴露检测”获得敏感流向基线，再执行“漏洞挖掘”做攻击面验证。
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

