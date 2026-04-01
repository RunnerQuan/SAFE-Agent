'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, FileJson, Loader2, ShieldAlert, Upload, Workflow } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createScan, getScan } from '@/lib/api'
import type { Scan } from '@/lib/types'
import { scanTypeLabels } from '@/lib/utils'

function parseMetadataPreview(raw: string) {
  if (!raw.trim()) {
    return { count: 0, error: null as string | null }
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.tools)
      ? parsed.tools
      : Array.isArray(parsed?.metadata)
      ? parsed.metadata
      : Array.isArray(parsed?.functions)
      ? parsed.functions
      : Array.isArray(parsed?.items)
      ? parsed.items
      : null

    if (!list) {
      return {
        count: 0,
        error: 'metadata 必须是 JSON 数组，或包含 tools / metadata / functions / items 数组字段。',
      }
    }

    return { count: list.length, error: null as string | null }
  } catch {
    return { count: 0, error: 'metadata JSON 格式不合法。' }
  }
}

function splitFunctionList(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeCopySource(scan: Scan) {
  return {
    taskName:
      (typeof scan.params?.taskName === 'string' && scan.params.taskName) ||
      scan.title ||
      '联合检测任务',
    metadataText: typeof scan.params?.metadataText === 'string' ? scan.params.metadataText : '',
    metadataFilename: typeof scan.params?.metadataFilename === 'string' ? scan.params.metadataFilename : '',
    sourceFunctionsText: Array.isArray(scan.params?.sourceFunctions) ? (scan.params?.sourceFunctions as string[]).join('\n') : '',
    sinkFunctionsText: Array.isArray(scan.params?.sinkFunctions) ? (scan.params?.sinkFunctions as string[]).join('\n') : '',
  }
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
  const copyFrom = searchParams.get('copyFrom')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [formData, setFormData] = useState({
    taskName: '',
    metadataText: '',
    metadataFilename: '',
    sourceFunctionsText: '',
    sinkFunctionsText: '',
  })

  const { data: copySource } = useQuery({
    queryKey: ['scan-copy-source', copyFrom],
    queryFn: () => getScan(copyFrom as string),
    enabled: Boolean(copyFrom),
  })

  useEffect(() => {
    if (!copySource) {
      return
    }

    const next = normalizeCopySource(copySource)
    setFormData((current) => ({
      ...current,
      ...next,
      taskName: current.taskName || `${next.taskName} - 副本`,
    }))
    setAdvancedOpen(Boolean(next.sourceFunctionsText || next.sinkFunctionsText))
  }, [copySource])

  const metadataPreview = useMemo(() => parseMetadataPreview(formData.metadataText), [formData.metadataText])
  const sourceFunctions = useMemo(() => splitFunctionList(formData.sourceFunctionsText), [formData.sourceFunctionsText])
  const sinkFunctions = useMemo(() => splitFunctionList(formData.sinkFunctionsText), [formData.sinkFunctionsText])
  const exposureEnabled = sourceFunctions.length > 0 && sinkFunctions.length > 0
  const selectedChecks = useMemo(
    () => ['fuzzing', ...(exposureEnabled ? (['exposure'] as const) : [])],
    [exposureEnabled]
  )

  const createMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      toast.success('联合检测任务已创建。')
      router.push(`/scans/${scan.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后重试。')
    },
  })

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      setFormData((prev) => ({
        ...prev,
        metadataText: text,
        metadataFilename: file.name,
      }))
      toast.success(`已加载 ${file.name}`)
    } catch {
      toast.error('读取文件失败。')
    }
  }

  const handleSubmit = () => {
    if (!formData.taskName.trim()) {
      toast.error('请填写任务名称。')
      return
    }

    if (!formData.metadataText.trim()) {
      toast.error('请上传或粘贴工具 metadata JSON。')
      return
    }

    if (metadataPreview.error) {
      toast.error(metadataPreview.error)
      return
    }

    createMutation.mutate({
      title: formData.taskName.trim(),
      types: selectedChecks,
      params: {
        taskName: formData.taskName.trim(),
        metadataText: formData.metadataText,
        metadataFilename: formData.metadataFilename || undefined,
        sourceFunctions,
        sinkFunctions,
        toolCount: metadataPreview.count,
      },
    })
  }

  const handleReset = () => {
    setFormData({
      taskName: '',
      metadataText: '',
      metadataFilename: '',
      sourceFunctionsText: '',
      sinkFunctionsText: '',
    })
    setAdvancedOpen(false)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="联合安全检测"
        description="一次输入，同时执行数据过度暴露检测与组合式漏洞检测，并在同一任务详情页查看完整结果。"
        breadcrumbs={[
          { title: '任务', href: '/scans' },
          { title: '新建任务' },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-[1.8rem]">
          <CardContent className="space-y-8 p-6">
            <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/35">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">联合工作流</Badge>
                <Badge variant="outline">共享 metadata 输入</Badge>
              </div>
              <h2 className="font-display text-3xl text-slate-950 dark:text-slate-50">一次提交，同时跑两类检测</h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                系统会基于同一份工具 metadata 同步组织两类分析。组合式漏洞检测默认启用；填写 DOE 的 source 和 sink 后，数据过度暴露检测也会一并执行。
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={exposureEnabled ? 'succeeded' : 'outline'}>{scanTypeLabels.exposure}</Badge>
                <Badge variant="running">{scanTypeLabels.fuzzing}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="taskName" className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                任务名称
              </Label>
              <Input
                id="taskName"
                value={formData.taskName}
                onChange={(event) => setFormData((prev) => ({ ...prev, taskName: event.target.value }))}
                placeholder="例如：Office Agent 联合检测"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">工具 metadata</Label>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    支持粘贴 JSON 或上传 `.json` 文件。系统会自动统计工具数量，并在提交前检查结构是否合法。
                  </p>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
                <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  上传 JSON
                </Button>
              </div>

              <Textarea
                value={formData.metadataText}
                onChange={(event) => setFormData((prev) => ({ ...prev, metadataText: event.target.value }))}
                placeholder={`[\n  {\n    "func_signature": "get_email_content",\n    "description": "Get the full content of a specific email by its ID.",\n    "MCP": "Claude Post",\n    "code": "def get_email_content(...)"\n  }\n]`}
                className="min-h-[320px] font-mono"
              />

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {formData.metadataFilename && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-950/40">
                    <FileJson className="h-4 w-4" />
                    {formData.metadataFilename}
                  </span>
                )}
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  工具数量：{metadataPreview.count}
                </span>
                {metadataPreview.error && <span className="text-rose-500">{metadataPreview.error}</span>}
              </div>
            </div>

            <Card className="rounded-[1.5rem] border-dashed border-slate-300/80 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/30">
              <CardHeader>
                <button type="button" onClick={() => setAdvancedOpen((prev) => !prev)} className="flex w-full items-center justify-between gap-4 text-left">
                  <div>
                    <CardTitle>高级配置：DOE Source / Sink</CardTitle>
                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      仅数据过度暴露检测使用。若不填写，当前任务仍可运行组合式漏洞检测。
                    </p>
                  </div>
                  {advancedOpen ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                </button>
              </CardHeader>

              {advancedOpen && (
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">Source 函数</Label>
                    <Textarea
                      value={formData.sourceFunctionsText}
                      onChange={(event) => setFormData((prev) => ({ ...prev, sourceFunctionsText: event.target.value }))}
                      placeholder="每行一个函数名，例如：\nget_email_content\nchrome_get_web_content"
                      className="min-h-[180px] font-mono"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sink 函数</Label>
                    <Textarea
                      value={formData.sinkFunctionsText}
                      onChange={(event) => setFormData((prev) => ({ ...prev, sinkFunctionsText: event.target.value }))}
                      placeholder="每行一个函数名，例如：\nsend_email\nsend_message"
                      className="min-h-[180px] font-mono"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem]">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="panel-eyebrow">任务摘要</p>
              <h2 className="mt-3 font-display text-2xl text-slate-900 dark:text-slate-50">本次将执行</h2>
            </div>

            <SummaryBlock label="任务名称" value={formData.taskName || '未填写'} />
            <SummaryBlock label="工具数量" value={metadataPreview.count > 0 ? `${metadataPreview.count} 个工具` : '等待解析'} />
            <SummaryBlock
              label="DOE 检测"
              value={exposureEnabled ? '已启用' : '未启用'}
              caption={exposureEnabled ? '已同时填写 source 和 sink。' : '填写 source 和 sink 后会并行执行。'}
            />
            <SummaryBlock label="组合式漏洞检测" value="已启用" caption="默认运行，无需额外参数。" />

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                <div className="space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <p>DOE 检测会围绕 source、sink 和调用链识别敏感数据暴露问题。</p>
                  <p>组合式漏洞检测会基于同一份 metadata 提取候选链路、sink 工具和 source 风险。</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedChecks.map((type) => (
                <Badge key={type} variant={type === 'exposure' ? 'medium' : 'running'}>
                  {scanTypeLabels[type]}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在创建任务
                  </>
                ) : (
                  '开始联合检测'
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleReset} disabled={createMutation.isPending}>
                重置输入
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function SummaryBlock({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">{value}</p>
      {caption && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p>}
    </div>
  )
}
