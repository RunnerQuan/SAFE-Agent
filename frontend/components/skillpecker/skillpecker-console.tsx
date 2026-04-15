'use client'

import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, FileArchive, FolderTree, KeyRound, RefreshCw, ScanSearch } from 'lucide-react'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { SkillPeckerEmptyState } from '@/components/skillpecker/skillpecker-empty-state'
import { SkillPeckerResultDialog } from '@/components/skillpecker/skillpecker-result-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useCreateSkillPeckerScan,
  useSkillPeckerJobDetail,
  useSkillPeckerQueue,
  useSkillPeckerSkillResult,
} from '@/lib/skillpecker/hooks'
import { cn, formatDate } from '@/lib/utils'

type UploadMode = 'archive' | 'directory'

type RuntimeScanConfig = {
  provider: string
  model: string
  apiKey: string
}

type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string
  directory?: string
}

type ProviderOption = {
  value: string
  label: string
  placeholder: string
  example: string
  compatibility: 'openai-compatible' | 'native'
}

const directoryInputProps: DirectoryInputProps = {
  webkitdirectory: '',
  directory: '',
}

const providerOptions: ProviderOption[] = [
  {
    value: 'deepseek',
    label: 'DeepSeek',
    placeholder: 'deepseek-chat',
    example: 'deepseek-chat / deepseek-reasoner',
    compatibility: 'openai-compatible',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    placeholder: 'gpt-4.1-mini',
    example: 'gpt-4.1-mini / gpt-4.1',
    compatibility: 'openai-compatible',
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    placeholder: 'openai/gpt-4.1-mini',
    example: 'openai/gpt-4.1-mini / anthropic/claude-3.7-sonnet',
    compatibility: 'openai-compatible',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    placeholder: 'claude-3-7-sonnet-20250219',
    example: 'claude-3-7-sonnet-20250219',
    compatibility: 'native',
  },
  {
    value: 'gemini',
    label: 'Gemini',
    placeholder: 'gemini-2.5-pro',
    example: 'gemini-2.5-pro / gemini-2.5-flash',
    compatibility: 'native',
  },
  {
    value: 'groq',
    label: 'Groq',
    placeholder: 'llama-3.3-70b-versatile',
    example: 'llama-3.3-70b-versatile',
    compatibility: 'openai-compatible',
  },
  {
    value: 'moonshot',
    label: 'Moonshot',
    placeholder: 'moonshot-v1-8k',
    example: 'moonshot-v1-8k / moonshot-v1-128k',
    compatibility: 'openai-compatible',
  },
  {
    value: 'together',
    label: 'Together AI',
    placeholder: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    example: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    compatibility: 'openai-compatible',
  },
  {
    value: 'siliconflow',
    label: 'SiliconFlow',
    placeholder: 'Qwen/Qwen2.5-72B-Instruct',
    example: 'Qwen/Qwen2.5-72B-Instruct',
    compatibility: 'openai-compatible',
  },
  {
    value: 'dashscope',
    label: 'DashScope',
    placeholder: 'qwen-plus',
    example: 'qwen-plus / qwen-max',
    compatibility: 'openai-compatible',
  },
  {
    value: 'glm',
    label: 'GLM',
    placeholder: 'glm-4.7',
    example: 'glm-4.7 / glm-4.5-air / glm-4-plus',
    compatibility: 'openai-compatible',
  },
]

const scanSteps = [
  { index: '01', title: '配置模型', copy: '按服务商选择模型名称，并输入仅用于本次任务的 API Key。' },
  { index: '02', title: '上传技能包', copy: '支持 ZIP 压缩包或本地文件夹，文件会异步进入扫描队列。' },
  { index: '03', title: '查看结果', copy: '任务完成后直接打开结果详情，查看风险分类与证据链。' },
]

function getProviderMeta(provider: string) {
  return providerOptions.find((item) => item.value === provider) ?? providerOptions[0]
}

function getProviderLabel(provider: string) {
  return getProviderMeta(provider).label
}

function getJobSummary(job: { skillCount: number; summaryExcerpt?: { labelCounts: Record<string, number> } | null }) {
  if (!job.summaryExcerpt) {
    return `已提交 ${job.skillCount} 个技能`
  }

  const counts = job.summaryExcerpt.labelCounts ?? {}
  const malicious = (counts.malicious ?? 0) + (counts.mixed_risk ?? 0)
  const suspicious = (counts.unsafe ?? 0) + (counts.insufficient_evidence ?? 0) + (counts.description_unreliable ?? 0)
  const safe = counts.safe ?? 0
  const parts: string[] = []

  if (malicious > 0) parts.push(`${malicious} 个恶意`)
  if (suspicious > 0) parts.push(`${suspicious} 个可疑`)
  if (safe > 0) parts.push(`${safe} 个安全`)

  return parts.length ? parts.join(' · ') : `已扫描 ${job.skillCount} 个技能`
}

function getStatusLabel(status: string) {
  if (status === 'completed') return '已完成'
  if (status === 'running') return '运行中'
  if (status === 'queued') return '队列中'
  if (status === 'failed') return '失败'
  return status
}

export function SkillPeckerConsole() {
  const queryClient = useQueryClient()
  const archiveInputRef = useRef<HTMLInputElement | null>(null)
  const directoryInputRef = useRef<HTMLInputElement | null>(null)

  const [uploadMode, setUploadMode] = useState<UploadMode>('archive')
  const [archiveFiles, setArchiveFiles] = useState<File[]>([])
  const [directoryFiles, setDirectoryFiles] = useState<File[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string>()
  const [activeSkillName, setActiveSkillName] = useState<string>()
  const [showApiKey, setShowApiKey] = useState(false)
  const [scanConfig, setScanConfig] = useState<RuntimeScanConfig>({
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: '',
  })

  const queueQuery = useSkillPeckerQueue()
  const createMutation = useCreateSkillPeckerScan()
  const jobDetailQuery = useSkillPeckerJobDetail(dialogOpen ? activeJobId : undefined)
  const skillResultQuery = useSkillPeckerSkillResult(dialogOpen ? activeJobId : undefined, dialogOpen ? activeSkillName : undefined)

  useEffect(() => {
    if (!jobDetailQuery.data?.skills.length) {
      return
    }

    if (!activeSkillName || !jobDetailQuery.data.skills.some((item) => item.name === activeSkillName)) {
      setActiveSkillName(jobDetailQuery.data.skills[0].name)
    }
  }, [activeSkillName, jobDetailQuery.data])

  const providerMeta = getProviderMeta(scanConfig.provider)
  const selectedFiles = uploadMode === 'archive' ? archiveFiles : directoryFiles
  const normalizedModel = scanConfig.model.trim()
  const normalizedApiKey = scanConfig.apiKey.trim()
  const isScanConfigComplete = Boolean(scanConfig.provider && normalizedModel && normalizedApiKey)
  const isReadyToSubmit = selectedFiles.length > 0 && isScanConfigComplete

  const selectionSummary = useMemo(() => {
    if (uploadMode === 'archive') {
      return archiveFiles.map((file) => file.name)
    }

    return directoryFiles.slice(0, 6).map((file) => file.webkitRelativePath || file.name)
  }, [archiveFiles, directoryFiles, uploadMode])

  const stepStates = {
    choose: isScanConfigComplete,
    queue: createMutation.isPending || Boolean(queueQuery.data?.jobs.length),
    inspect: Boolean(queueQuery.data?.jobs.some((job) => job.status === 'completed')),
  }

  const handleArchiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setArchiveFiles(Array.from(event.target.files ?? []))
  }

  const handleDirectoryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDirectoryFiles(Array.from(event.target.files ?? []))
  }

  const openResult = (jobId: string) => {
    setActiveJobId(jobId)
    setActiveSkillName(undefined)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (uploadMode === 'archive' && archiveFiles.length === 0) {
      toast.error('请先选择至少一个 ZIP 压缩包。')
      return
    }

    if (uploadMode === 'directory' && directoryFiles.length === 0) {
      toast.error('请先选择包含技能内容的文件夹。')
      return
    }

    if (!scanConfig.provider) {
      toast.error('请选择本次扫描使用的服务商。')
      return
    }

    if (!normalizedModel) {
      toast.error('请填写本次扫描使用的模型名称。')
      return
    }

    if (!normalizedApiKey) {
      toast.error('请填写本次扫描使用的 API Key。')
      return
    }

    const formData = new FormData()
    formData.append('llm_provider', scanConfig.provider)
    formData.append('llm_model', normalizedModel)
    formData.append('llm_api_key', normalizedApiKey)

    if (uploadMode === 'archive') {
      archiveFiles.forEach((file) => formData.append('archives', file))
    } else {
      directoryFiles.forEach((file) => {
        formData.append('files', file)
        formData.append('relative_paths', file.webkitRelativePath || file.name)
      })
    }

    try {
      const result = await createMutation.mutateAsync(formData)
      toast.success('扫描任务已创建。')
      setArchiveFiles([])
      setDirectoryFiles([])
      if (archiveInputRef.current) archiveInputRef.current.value = ''
      if (directoryInputRef.current) directoryInputRef.current.value = ''

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['skillpecker', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['skillpecker', 'overview'] }),
      ])

      if (result.job?.id) {
        openResult(result.job.id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建扫描任务失败。')
    }
  }

  if (queueQuery.error) {
    return <ErrorState title="扫描控制台加载失败" onRetry={() => queueQuery.refetch()} />
  }

  return (
    <div className="skillpecker-console-stack">
      <Card className="skillpecker-console-launchpad p-5 sm:p-7">
        <div className="skillpecker-console-launchpad-grid">
          <div className="skillpecker-console-copy">
            <div className="skillpecker-console-copy-head">
              <div>
                <h2 className="skillpecker-console-title skillpecker-console-title-single">技能安全检测</h2>
                <p className="skillpecker-console-description">保留服务商切换，同时使用更接近主流 AI 控制台的模型名称输入方式。</p>
              </div>
            </div>

            <div className="skillpecker-console-status-strip">
              <article className="skillpecker-console-status-tile is-running">
                <span className="skillpecker-console-status-label">运行中</span>
                <strong>{queueQuery.data?.queue.running ?? 0}</strong>
              </article>
              <article className="skillpecker-console-status-tile is-queued">
                <span className="skillpecker-console-status-label">队列中</span>
                <strong>{queueQuery.data?.queue.queued ?? 0}</strong>
              </article>
              <article className="skillpecker-console-status-tile is-completed">
                <span className="skillpecker-console-status-label">已完成</span>
                <strong>{queueQuery.data?.queue.completed ?? 0}</strong>
              </article>
            </div>

            <div className="skillpecker-console-step-grid">
              {scanSteps.map((step, index) => {
                const isActive = index === 0 ? stepStates.choose : index === 1 ? stepStates.queue : stepStates.inspect

                return (
                  <article
                    key={step.index}
                    className={cn('skillpecker-console-step-card', isActive && 'is-active')}
                    style={{ ['--step-delay' as string]: `${index * 120}ms` }}
                  >
                    <span className="skillpecker-console-step-index">{step.index}</span>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </article>
                )
              })}
            </div>

            <Card className="skillpecker-console-config-card skillpecker-console-config-card-left">
              <div className="skillpecker-console-config-head">
                <div>
                  <h4 className="skillpecker-console-config-title">模型与密钥</h4>
                </div>
                <Badge variant={isScanConfigComplete ? 'safe' : 'outline'} className="skillpecker-console-config-badge">
                  {isScanConfigComplete ? '可开始扫描' : '待补全'}
                </Badge>
              </div>

              <div className="skillpecker-console-provider-strip">
                <span className="skillpecker-console-provider-chip">{providerMeta.label}</span>
                <span
                  className={cn(
                    'skillpecker-console-provider-chip',
                    providerMeta.compatibility === 'openai-compatible' && 'is-openai-compatible'
                  )}
                >
                  {providerMeta.compatibility === 'openai-compatible' ? 'OpenAI 兼容风格' : '原生接口模型名'}
                </span>
              </div>

              <div className="skillpecker-console-config-grid">
                <div className="skillpecker-console-config-field">
                  <Label htmlFor="skillpecker-provider" className="skillpecker-console-config-label">
                    服务商
                  </Label>
                  <Select
                    value={scanConfig.provider}
                    onValueChange={(value) => setScanConfig((current) => ({ ...current, provider: value }))}
                  >
                    <SelectTrigger id="skillpecker-provider">
                      <SelectValue placeholder="选择服务商" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="skillpecker-console-config-field">
                  <Label htmlFor="skillpecker-model" className="skillpecker-console-config-label">
                    模型名称
                  </Label>
                  <Input
                    id="skillpecker-model"
                    value={scanConfig.model}
                    onChange={(event) => setScanConfig((current) => ({ ...current, model: event.target.value }))}
                    placeholder={`例如：${providerMeta.placeholder}`}
                    autoComplete="off"
                  />
                </div>

                <div className="skillpecker-console-config-field skillpecker-console-config-field-wide">
                  <p className="skillpecker-console-model-helper">
                    按该服务商的官方模型名填写。示例：<strong>{providerMeta.example}</strong>
                  </p>
                </div>

                <div className="skillpecker-console-config-field skillpecker-console-config-field-wide">
                  <div className="skillpecker-console-config-secret-head">
                    <Label htmlFor="skillpecker-api-key" className="skillpecker-console-config-label">
                      API Key
                    </Label>
                  </div>

                  <div className="skillpecker-console-secret-wrap">
                    <KeyRound className="skillpecker-console-secret-icon" />
                    <Input
                      id="skillpecker-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={scanConfig.apiKey}
                      onChange={(event) => setScanConfig((current) => ({ ...current, apiKey: event.target.value }))}
                      placeholder="输入本次扫描使用的密钥"
                      autoComplete="off"
                      className="skillpecker-console-secret-input"
                    />
                    <button
                      type="button"
                      className="skillpecker-console-secret-toggle"
                      onClick={() => setShowApiKey((current) => !current)}
                      aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="skillpecker-console-form skillpecker-console-form-refined">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="skillpecker-console-form-title">上传扫描内容</h3>
                <p className="skillpecker-console-form-subtitle">右侧只处理上传与提交，结构更接近常见 AI 工具工作台。</p>
              </div>
              <Button variant="outline" size="sm" className="skillpecker-console-refresh" onClick={() => queueQuery.refetch()}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                刷新
              </Button>
            </div>

            <div className="skillpecker-upload-mode-switch skillpecker-upload-mode-switch-refined" role="tablist" aria-label="上传模式">
              <button
                type="button"
                className={cn('skillpecker-upload-mode-button skillpecker-upload-mode-archive', uploadMode === 'archive' && 'is-active')}
                onClick={() => setUploadMode('archive')}
              >
                ZIP 压缩包
              </button>
              <button
                type="button"
                className={cn(
                  'skillpecker-upload-mode-button skillpecker-upload-mode-directory',
                  uploadMode === 'directory' && 'is-active'
                )}
                onClick={() => setUploadMode('directory')}
              >
                文件夹
              </button>
            </div>

            <Card
              className={cn(
                'skillpecker-upload-tile skillpecker-upload-tile-refined p-5',
                uploadMode === 'archive' ? 'is-archive' : 'is-directory'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn('skillpecker-upload-icon', uploadMode === 'archive' ? 'is-archive' : 'is-directory')}>
                  {uploadMode === 'archive' ? <FileArchive className="h-5 w-5" /> : <FolderTree className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="skillpecker-upload-badge">
                      {uploadMode === 'archive' ? '压缩包输入' : '目录输入'}
                    </Badge>
                    <h4 className="skillpecker-upload-heading">{uploadMode === 'archive' ? '上传 ZIP 包' : '上传文件夹'}</h4>
                  </div>
                  <p className="skillpecker-upload-description">
                    {uploadMode === 'archive'
                      ? '可提交一个或多个 ZIP 压缩包，系统会自动提取其中的技能目录。'
                      : '可提交本地文件夹，系统会按相对路径恢复目录结构后再执行扫描。'}
                  </p>
                </div>
              </div>

              <div className="skillpecker-upload-picker">
                {uploadMode === 'archive' ? (
                  <>
                    <input
                      ref={archiveInputRef}
                      type="file"
                      accept=".zip"
                      multiple
                      className="hidden"
                      onChange={handleArchiveChange}
                    />
                    <button type="button" className="skillpecker-upload-picker-button" onClick={() => archiveInputRef.current?.click()}>
                      选择 ZIP 文件
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      ref={directoryInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleDirectoryChange}
                      {...directoryInputProps}
                    />
                    <button type="button" className="skillpecker-upload-picker-button" onClick={() => directoryInputRef.current?.click()}>
                      选择文件夹
                    </button>
                  </>
                )}

                <span className="skillpecker-upload-picker-status">
                  {selectedFiles.length ? `已选择 ${selectedFiles.length} 个输入项` : '尚未选择文件'}
                </span>
              </div>
            </Card>

            <Card className="skillpecker-selected-packages p-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="skillpecker-selected-title">已选内容</h4>
                <span className="skillpecker-selected-meta">{uploadMode === 'archive' ? 'ZIP 压缩包' : '文件夹'}</span>
              </div>

              <div className="skillpecker-selected-list">
                {selectionSummary.length ? (
                  <div className="space-y-2">
                    {selectionSummary.map((item) => (
                      <div key={item} className="skillpecker-selected-item">
                        {item}
                      </div>
                    ))}
                    {selectedFiles.length > selectionSummary.length ? (
                      <p className="skillpecker-selected-overflow">另外还有 {selectedFiles.length - selectionSummary.length} 项未展开显示。</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="skillpecker-selected-empty">尚未选择任何包。</p>
                )}
              </div>
            </Card>

            <div className="skillpecker-console-submit-row">
              <p className="skillpecker-console-submit-hint">
                {!isScanConfigComplete
                  ? '先在左侧补全 Provider、模型名称与 API Key。'
                  : !selectedFiles.length
                    ? '配置已完整，继续在右侧选择 ZIP 包或本地文件夹。'
                    : '输入和上传都已完整，可以开始本次技能扫描。'}
              </p>
              <Button className="skillpecker-console-submit-button" onClick={handleSubmit} disabled={!isReadyToSubmit || createMutation.isPending}>
                <ScanSearch className="mr-2 h-4 w-4" />
                {createMutation.isPending ? '正在提交…' : '开始扫描'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="skillpecker-console-queue skillpecker-console-queue-refined p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="skillpecker-queue-title">任务队列</h3>
          </div>
          <Badge variant="outline" className="skillpecker-queue-count">
            {queueQuery.data?.jobs.length ?? 0} 个任务
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {queueQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 p-6 text-sm text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
              正在读取任务队列…
            </div>
          ) : queueQuery.data?.jobs.length ? (
            queueQuery.data.jobs.map((job) => (
              <Card key={job.id} className="skillpecker-queue-card skillpecker-queue-card-refined p-5">
                <div className="skillpecker-queue-card-grid">
                  <div className="min-w-0">
                    <p className="skillpecker-queue-kicker">任务</p>
                    <p className="skillpecker-queue-job-id">{job.id}</p>
                    <p className="skillpecker-queue-summary">{getJobSummary(job)}</p>
                    <div className="skillpecker-queue-meta-row">
                      <Badge variant="outline" className="skillpecker-queue-skill-badge">
                        技能 {job.skillCount}
                      </Badge>
                      {job.llmConfig ? (
                        <span className="skillpecker-queue-llm-chip">
                          {getProviderLabel(job.llmConfig.provider)} / {job.llmConfig.model}
                        </span>
                      ) : null}
                      {typeof job.queuePosition === 'number' ? (
                        <span className="skillpecker-queue-position">队列位置 #{job.queuePosition}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="skillpecker-queue-side">
                    <span className="skillpecker-queue-time">{job.createdAt ? formatDate(job.createdAt) : '等待时间戳'}</span>
                    <Badge variant={job.status === 'completed' ? 'succeeded' : job.status} className="skillpecker-queue-status-badge">
                      {getStatusLabel(job.status)}
                    </Badge>
                    <Button variant="outline" className="skillpecker-queue-result-button" onClick={() => openResult(job.id)}>
                      查看结果
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <SkillPeckerEmptyState title="暂无队列任务" description="上传 ZIP 包或本地目录后，任务会显示在这里。" />
          )}
        </div>
      </Card>

      <SkillPeckerResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobDetail={jobDetailQuery.data}
        activeSkillName={activeSkillName}
        onSelectSkill={setActiveSkillName}
        skillResult={skillResultQuery.data}
        isLoading={jobDetailQuery.isLoading || skillResultQuery.isLoading}
      />
    </div>
  )
}
