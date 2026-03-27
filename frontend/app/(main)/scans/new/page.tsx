'use client'

import { Suspense, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { FileJson, Loader2, ShieldAlert, Upload, Workflow } from 'lucide-react'
import { toast } from 'sonner'

import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createScan } from '@/lib/api'
import { cn, scanTypeLabels } from '@/lib/utils'

function parseMetadataPreview(raw: string) {
  if (!raw.trim()) {
    return { count: 0, names: [] as string[], error: null as string | null }
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
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
        names: [],
        error: 'metadata 必须是 JSON 数组，或包含 metadata / functions / items 数组字段。',
      }
    }

    const names = list.map((item: Record<string, unknown>, index: number) =>
      String(item.name || item.func_name || item.func_signature || item.signature || `tool_${index + 1}`)
    )

    return { count: list.length, names, error: null as string | null }
  } catch {
    return { count: 0, names: [], error: 'metadata JSON 格式不合法。' }
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [taskName, setTaskName] = useState('')
  const [metadataText, setMetadataText] = useState('')
  const [metadataFilename, setMetadataFilename] = useState('')
  const [selectedChecks, setSelectedChecks] = useState<Array<'exposure' | 'fuzzing'>>(['exposure', 'fuzzing'])

  const metadataPreview = useMemo(() => parseMetadataPreview(metadataText), [metadataText])

  const createMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      toast.success('任务已创建')
      router.push(`/scans/${scan.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后重试。')
    },
  })

  const toggleCheck = (value: 'exposure' | 'fuzzing') => {
    setSelectedChecks((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setMetadataText(text)
      setMetadataFilename(file.name)
      toast.success(`已载入 ${file.name}`)
    } catch {
      toast.error('读取文件失败。')
    }
  }

  const handleSubmit = () => {
    if (!metadataText.trim()) {
      toast.error('请上传或粘贴工具 metadata。')
      return
    }

    if (metadataPreview.error) {
      toast.error(metadataPreview.error)
      return
    }

    if (selectedChecks.length === 0) {
      toast.error('请至少选择一种检测。')
      return
    }

    createMutation.mutate({
      agentId: 'tool-batch',
      title: taskName.trim() || `工具 metadata 扫描 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      types: selectedChecks,
      params: {
        taskName: taskName.trim(),
        metadataText,
        metadataFilename: metadataFilename || undefined,
      },
    })
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="新建任务"
        description="输入一组工具 metadata，统一执行数据过度暴露检测与组合式漏洞检测。"
        breadcrumbs={[
          { title: '任务', href: '/scans' },
          { title: '新建任务' },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="rounded-[1.8rem]">
          <CardContent className="space-y-8 p-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">任务名称</Label>
              <Input
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="例如：办公工具链 metadata 扫描"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">检测范围</Label>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  两种检测的输入都来自同一组工具 metadata，可以单独执行，也可以一起执行。
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    id: 'exposure' as const,
                    title: '数据过度暴露检测',
                    copy: '识别哪些工具在调用链中读取、拼接或传递了超出任务所需的数据。',
                    icon: ShieldAlert,
                  },
                  {
                    id: 'fuzzing' as const,
                    title: '组合式漏洞检测',
                    copy: '识别哪些工具与其他工具串联后形成越权、扩散或放大路径。',
                    icon: Workflow,
                  },
                ].map((item) => {
                  const active = selectedChecks.includes(item.id)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        'rounded-[1.4rem] border p-5 text-left transition-all',
                        active
                          ? 'border-sky-400/40 bg-sky-500/10 shadow-[0_18px_36px_rgba(14,165,233,0.10)]'
                          : 'border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bento-icon bg-white/72 dark:bg-slate-900/72">
                          <item.icon className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                        </div>
                        <p className="font-display text-xl text-slate-950 dark:text-slate-50">{item.title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.copy}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold text-slate-900 dark:text-slate-50">工具 metadata</Label>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    支持上传 `.json` 文件或直接粘贴 JSON 数组。每项至少包含工具名、签名或描述。
                  </p>
                </div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
                  <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    上传 JSON
                  </Button>
                </div>
              </div>

              <Textarea
                value={metadataText}
                onChange={(event) => setMetadataText(event.target.value)}
                placeholder={`[\n  {\n    "name": "read_email_content",\n    "func_signature": "read_email_content(message_id: string)",\n    "description": "读取邮件正文",\n    "MCP": "Mail"\n  }\n]`}
                className="min-h-[320px] font-mono"
              />

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {metadataFilename && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-700 dark:bg-slate-950/40">
                    <FileJson className="h-4 w-4" />
                    {metadataFilename}
                  </span>
                )}
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  工具数量：{metadataPreview.count}
                </span>
                {metadataPreview.error && <span className="text-red-500">{metadataPreview.error}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem]">
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="panel-eyebrow">任务摘要</p>
              <h2 className="mt-3 font-display text-2xl text-slate-950 dark:text-slate-50">当前输入</h2>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">任务名称</p>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">{taskName || '未命名任务'}</p>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">检测范围</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedChecks.length > 0 ? (
                  selectedChecks.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      {scanTypeLabels[item]}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">尚未选择</span>
                )}
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">工具 metadata</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{metadataPreview.count} 个工具</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {metadataFilename || '未上传文件，使用文本输入'}
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                报告将只保留两部分：哪些工具存在 DOE，哪些工具存在组合式漏洞，以及对应的检测信息。
              </p>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中
                </>
              ) : (
                '提交任务'
              )}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
