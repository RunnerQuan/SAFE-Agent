'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileJson, Loader2, Search, ShieldAlert, Upload } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { createScan, getScan } from '@/lib/api'
import type { Scan } from '@/lib/types'
import { scanTypeLabels } from '@/lib/utils'

type FunctionCandidate = {
  name: string
  description: string
}

type MetadataPreview = {
  count: number
  error: string | null
  functions: FunctionCandidate[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getMetadataList(parsed: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord)
  }

  if (!isRecord(parsed)) {
    return null
  }

  const candidates = [parsed.tools, parsed.metadata, parsed.functions, parsed.items]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord)
    }
  }

  return null
}

function readFunctionCandidate(item: Record<string, unknown>): FunctionCandidate | null {
  const nestedFunction = isRecord(item.function) ? item.function : null
  const name =
    readString(item.func_signature) ||
    readString(item.name) ||
    readString(item.signature) ||
    readString(nestedFunction?.name) ||
    readString(nestedFunction?.func_signature) ||
    readString(nestedFunction?.signature)

  if (!name) {
    return null
  }

  const description =
    readString(item.description) ||
    readString(item.summary) ||
    readString(item.details) ||
    readString(nestedFunction?.description) ||
    readString(nestedFunction?.summary)

  return { name, description }
}

function parseMetadataPreview(raw: string): MetadataPreview {
  if (!raw.trim()) {
    return { count: 0, error: null, functions: [] }
  }

  try {
    const parsed = JSON.parse(raw)
    const list = getMetadataList(parsed)

    if (!list) {
      return {
        count: 0,
        error: 'metadata 必须是 JSON 数组，或包含 tools / metadata / functions / items 数组字段。',
        functions: [],
      }
    }

    const functionMap = new Map<string, FunctionCandidate>()

    for (const item of list) {
      const candidate = readFunctionCandidate(item)
      if (!candidate) {
        continue
      }

      const existing = functionMap.get(candidate.name)
      if (!existing) {
        functionMap.set(candidate.name, candidate)
        continue
      }

      if (!existing.description && candidate.description) {
        functionMap.set(candidate.name, candidate)
      }
    }

    return {
      count: list.length,
      error: null,
      functions: Array.from(functionMap.values()).sort((left, right) => left.name.localeCompare(right.name, 'en')),
    }
  } catch {
    return { count: 0, error: 'metadata JSON 格式不合法。', functions: [] }
  }
}

function normalizeCopySource(scan: Scan) {
  return {
    taskName:
      (typeof scan.params?.taskName === 'string' && scan.params.taskName) ||
      scan.title ||
      '联合检测任务',
    metadataText: typeof scan.params?.metadataText === 'string' ? scan.params.metadataText : '',
    metadataFilename: typeof scan.params?.metadataFilename === 'string' ? scan.params.metadataFilename : '',
    sourceFunctions: Array.isArray(scan.params?.sourceFunctions)
      ? (scan.params.sourceFunctions as string[]).filter((item): item is string => typeof item === 'string')
      : [],
    sinkFunctions: Array.isArray(scan.params?.sinkFunctions)
      ? (scan.params.sinkFunctions as string[]).filter((item): item is string => typeof item === 'string')
      : [],
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

  const [functionSearch, setFunctionSearch] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [formData, setFormData] = useState({
    taskName: '',
    metadataText: '',
    metadataFilename: '',
    sourceFunctions: [] as string[],
    sinkFunctions: [] as string[],
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
  }, [copySource])

  const metadataPreview = useMemo(() => parseMetadataPreview(formData.metadataText), [formData.metadataText])

  useEffect(() => {
    if (metadataPreview.error) {
      return
    }

    const validNames = new Set(metadataPreview.functions.map((item) => item.name))
    setFormData((current) => {
      const nextSource = current.sourceFunctions.filter((item) => validNames.has(item))
      const nextSink = current.sinkFunctions.filter((item) => validNames.has(item))

      if (nextSource.length === current.sourceFunctions.length && nextSink.length === current.sinkFunctions.length) {
        return current
      }

      return {
        ...current,
        sourceFunctions: nextSource,
        sinkFunctions: nextSink,
      }
    })
  }, [metadataPreview.error, metadataPreview.functions])

  const exposureEnabled = formData.sourceFunctions.length > 0 && formData.sinkFunctions.length > 0
  const selectedChecks = useMemo(
    () => ['fuzzing', ...(exposureEnabled ? (['exposure'] as const) : [])],
    [exposureEnabled]
  )

  const visibleFunctions = useMemo(() => {
    const keyword = functionSearch.trim().toLowerCase()

    return metadataPreview.functions.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      const isSelected =
        formData.sourceFunctions.includes(item.name) || formData.sinkFunctions.includes(item.name)

      return matchesSearch && (!showSelectedOnly || isSelected)
    })
  }, [formData.sinkFunctions, formData.sourceFunctions, functionSearch, metadataPreview.functions, showSelectedOnly])

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

  const toggleRole = (role: 'sourceFunctions' | 'sinkFunctions', functionName: string, checked: boolean) => {
    setFormData((current) => {
      const currentValues = current[role]
      const nextValues = checked
        ? Array.from(new Set([...currentValues, functionName]))
        : currentValues.filter((item) => item !== functionName)

      return {
        ...current,
        [role]: nextValues,
      }
    })
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
        sourceFunctions: formData.sourceFunctions,
        sinkFunctions: formData.sinkFunctions,
        toolCount: metadataPreview.count,
      },
    })
  }

  const handleReset = () => {
    setFormData({
      taskName: '',
      metadataText: '',
      metadataFilename: '',
      sourceFunctions: [],
      sinkFunctions: [],
    })
    setFunctionSearch('')
    setShowSelectedOnly(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="联合安全检测"
        description="统一提交工具 metadata，并在同一任务中组织数据过度暴露检测与组合式漏洞检测。"
        breadcrumbs={[
          { title: '工具链风险分析', href: '/scans' },
          { title: '新建任务' },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-[1.8rem] border-white/75 bg-white/80 shadow-[0_22px_60px_rgba(56,80,120,0.12)]">
          <CardContent className="space-y-6 p-6">
            <section className="rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(232,244,255,0.82))] p-5 dark:border-slate-800 dark:bg-slate-950/35">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">联合工作流</Badge>
                <Badge variant="outline">共享 metadata 输入</Badge>
                <Badge variant={exposureEnabled ? 'succeeded' : 'outline'}>{scanTypeLabels.exposure}</Badge>
                <Badge variant="running">{scanTypeLabels.fuzzing}</Badge>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
                <div className="space-y-3">
                  <h2 className="font-display text-[2rem] leading-tight text-slate-950 dark:text-slate-50">
                    一次提交，统一配置工具链风险分析
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    组合式漏洞检测默认执行；在 DOE 函数角色表中勾选 Source 与 Sink 后，数据过度暴露检测会自动加入同一任务。函数支持同时承担两种角色。
                  </p>
                </div>
                <div className="grid gap-3 rounded-[1.3rem] border border-white/70 bg-white/80 p-4 text-sm text-slate-600 shadow-[0_12px_28px_rgba(41,55,79,0.08)] dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                  <InlineMetric label="解析到的工具" value={metadataPreview.count > 0 ? `${metadataPreview.count} 个` : '等待输入'} />
                  <InlineMetric label="可选函数" value={metadataPreview.functions.length > 0 ? `${metadataPreview.functions.length} 个` : '等待解析'} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-[1.5rem] border border-slate-200/75 bg-white/72 p-5 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="space-y-1">
                <p className="panel-eyebrow">基础信息</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">任务标识</h3>
              </div>
              <div className="space-y-3">
                <Label htmlFor="taskName" className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  任务名称
                </Label>
                <Input
                  id="taskName"
                  value={formData.taskName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, taskName: event.target.value }))}
                  placeholder="例如：Office Agent 工具链风险分析"
                />
              </div>
            </section>

            <section className="space-y-4 rounded-[1.5rem] border border-slate-200/75 bg-white/72 p-5 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="panel-eyebrow">共享输入</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">工具 metadata</h3>
                  <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                    支持粘贴 JSON 或上传 `.json` 文件。页面会自动提取函数名，供 DOE 角色表直接勾选。
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
                className="min-h-[260px] font-mono"
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
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  函数数量：{metadataPreview.functions.length}
                </span>
                {metadataPreview.error && <span className="text-rose-500">{metadataPreview.error}</span>}
              </div>
            </section>

            <section className="space-y-4 rounded-[1.5rem] border border-slate-200/75 bg-white/72 p-5 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="panel-eyebrow">DOE 配置</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">函数角色表</h3>
                  <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                    每个函数都可以独立勾选为 Source 或 Sink，同一个函数也可以同时承担两种角色。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[16rem] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={functionSearch}
                      onChange={(event) => setFunctionSearch(event.target.value)}
                      placeholder="搜索函数名或描述"
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant={showSelectedOnly ? 'default' : 'outline'}
                    onClick={() => setShowSelectedOnly((prev) => !prev)}
                  >
                    {showSelectedOnly ? '显示全部函数' : '仅看已勾选'}
                  </Button>
                </div>
              </div>

              {!formData.metadataText.trim() ? (
                <EmptyState message="先输入工具 metadata，系统会自动提取可选函数。" />
              ) : metadataPreview.error ? (
                <EmptyState message={metadataPreview.error} tone="danger" />
              ) : metadataPreview.functions.length === 0 ? (
                <EmptyState message="当前 metadata 中没有识别到可选函数。请确认存在 func_signature、name 或 function.name 字段。" />
              ) : visibleFunctions.length === 0 ? (
                <EmptyState message={showSelectedOnly ? '当前没有已勾选的函数。' : '没有匹配当前搜索条件的函数。'} />
              ) : (
                <ScrollArea className="h-[30rem] rounded-[1.2rem] border border-slate-200/80 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[14rem]">函数名</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead className="w-24 text-center">Source</TableHead>
                        <TableHead className="w-24 text-center">Sink</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleFunctions.map((item) => {
                        const sourceChecked = formData.sourceFunctions.includes(item.name)
                        const sinkChecked = formData.sinkFunctions.includes(item.name)

                        return (
                          <TableRow key={item.name}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-slate-900 dark:text-slate-50">{item.name}</p>
                                {(sourceChecked || sinkChecked) && (
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {sourceChecked && <Badge variant="medium">Source</Badge>}
                                    {sinkChecked && <Badge variant="running">Sink</Badge>}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                              {item.description || '未提供描述'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={sourceChecked}
                                  onCheckedChange={(checked) => toggleRole('sourceFunctions', item.name, checked === true)}
                                  aria-label={`${item.name} source`}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={sinkChecked}
                                  onCheckedChange={(checked) => toggleRole('sinkFunctions', item.name, checked === true)}
                                  aria-label={`${item.name} sink`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-[1.8rem] border-white/75 bg-white/82 shadow-[0_22px_60px_rgba(56,80,120,0.12)] xl:sticky xl:top-24">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="panel-eyebrow">任务摘要</p>
              <h2 className="mt-3 font-display text-2xl text-slate-900 dark:text-slate-50">本次将执行</h2>
            </div>

            <SummaryBlock label="任务名称" value={formData.taskName || '未填写'} />
            <SummaryBlock label="工具数量" value={metadataPreview.count > 0 ? `${metadataPreview.count} 个工具` : '等待解析'} />
            <SummaryBlock label="已选 Source" value={`${formData.sourceFunctions.length} 个函数`} />
            <SummaryBlock label="已选 Sink" value={`${formData.sinkFunctions.length} 个函数`} />
            <SummaryBlock
              label="DOE 检测"
              value={exposureEnabled ? '已启用' : '未启用'}
              caption={exposureEnabled ? '已配置 Source 与 Sink，将并行执行。' : '至少勾选 1 个 Source 和 1 个 Sink 后启用。'}
            />
            <SummaryBlock label="组合式漏洞检测" value="已启用" caption="默认执行，无需额外参数。" />

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                <div className="space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <p>DOE 基于 Source 与 Sink 的组合判断敏感数据暴露风险。</p>
                  <p>组合式漏洞检测会基于同一份 metadata 自动分析高风险链路。</p>
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

            <div className="flex flex-col gap-3 pt-1">
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

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-50">{value}</span>
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

function EmptyState({ message, tone = 'neutral' }: { message: string; tone?: 'neutral' | 'danger' }) {
  return (
    <div
      className={[
        'rounded-[1.2rem] border border-dashed px-4 py-10 text-center text-sm leading-7',
        tone === 'danger'
          ? 'border-rose-200 bg-rose-50/70 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300'
          : 'border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-400',
      ].join(' ')}
    >
      {message}
    </div>
  )
}
