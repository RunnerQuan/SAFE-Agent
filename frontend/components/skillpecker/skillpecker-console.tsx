'use client'

import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileArchive, FolderTree, RefreshCw, ScanSearch } from 'lucide-react'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { SkillPeckerEmptyState } from '@/components/skillpecker/skillpecker-empty-state'
import { SkillPeckerResultDialog } from '@/components/skillpecker/skillpecker-result-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  useCreateSkillPeckerScan,
  useSkillPeckerJobDetail,
  useSkillPeckerQueue,
  useSkillPeckerSkillResult,
} from '@/lib/skillpecker/hooks'
import { cn, formatDate } from '@/lib/utils'

type UploadMode = 'archive' | 'directory'

type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string
  directory?: string
}

const directoryInputProps: DirectoryInputProps = {
  webkitdirectory: '',
  directory: '',
}

const scanSteps = [
  { index: '01', title: '选择输入', copy: '上传 ZIP 压缩包或本地文件夹。' },
  { index: '02', title: '加入队列', copy: '将技能包发送到扫描流程并异步执行。' },
  { index: '03', title: '查看结果', copy: '在任务队列中打开发现详情与证据。' },
]

function getJobSummary(job: { skillCount: number; summaryExcerpt?: { labelCounts: Record<string, number> } | null }) {
  if (!job.summaryExcerpt) {
    return `已收纳 ${job.skillCount} 个 Skill`
  }

  const counts = job.summaryExcerpt.labelCounts ?? {}
  const malicious = (counts.malicious ?? 0) + (counts.mixed_risk ?? 0)
  const suspicious = (counts.unsafe ?? 0) + (counts.insufficient_evidence ?? 0) + (counts.description_unreliable ?? 0)
  const safe = counts.safe ?? 0
  const parts = []

  if (malicious > 0) parts.push(`${malicious} 个恶意`)
  if (suspicious > 0) parts.push(`${suspicious} 个可疑`)
  if (safe > 0) parts.push(`${safe} 个安全`)

  return parts.length ? parts.join(' · ') : `已扫描 ${job.skillCount} 个 Skill`
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

  const selectedFiles = uploadMode === 'archive' ? archiveFiles : directoryFiles

  const selectionSummary = useMemo(() => {
    if (uploadMode === 'archive') {
      return archiveFiles.map((file) => file.name)
    }

    return directoryFiles.slice(0, 6).map((file) => file.webkitRelativePath || file.name)
  }, [archiveFiles, directoryFiles, uploadMode])

  const stepStates = {
    choose: selectedFiles.length > 0,
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
      toast.error('请先选择包含 Skill 的文件夹。')
      return
    }

    const formData = new FormData()
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
      toast.success('SkillPecker 扫描任务已创建。')
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
                <span className="section-tag">上传工作站</span>
                <h2 className="skillpecker-console-title">
                  <span>技能</span>
                  <span>Skill</span>
                  <span>扫描</span>
                </h2>
                <p className="skillpecker-console-description">上传 ZIP 压缩包或本地文件夹，发起异步检测任务。</p>
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
          </div>

          <div className="skillpecker-console-form">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.1em] text-sky-600">上传工作站</p>
                <h3 className="mt-2 font-display text-3xl text-slate-950 dark:text-slate-50">新建扫描任务</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => queueQuery.refetch()}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                刷新
              </Button>
            </div>

            <div className="skillpecker-upload-mode-switch" role="tablist" aria-label="上传模式">
              <button
                type="button"
                className={cn('skillpecker-upload-mode-button skillpecker-upload-mode-archive', uploadMode === 'archive' && 'is-active')}
                onClick={() => setUploadMode('archive')}
              >
                压缩包输入
              </button>
              <button
                type="button"
                className={cn(
                  'skillpecker-upload-mode-button skillpecker-upload-mode-directory',
                  uploadMode === 'directory' && 'is-active'
                )}
                onClick={() => setUploadMode('directory')}
              >
                文件夹上传
              </button>
            </div>

            <Card className={cn('skillpecker-upload-tile p-5', uploadMode === 'archive' ? 'is-archive' : 'is-directory')}>
              <div className="flex items-start gap-4">
                <div className={cn('skillpecker-upload-icon', uploadMode === 'archive' ? 'is-archive' : 'is-directory')}>
                  {uploadMode === 'archive' ? <FileArchive className="h-5 w-5" /> : <FolderTree className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline">{uploadMode === 'archive' ? '压缩包输入' : '文件夹上传'}</Badge>
                    <h4 className="font-display text-[2rem] leading-none text-slate-950 dark:text-slate-50">
                      {uploadMode === 'archive' ? '上传 ZIP 包' : '上传文件夹'}
                    </h4>
                  </div>
                  <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                    {uploadMode === 'archive'
                      ? '可提交一个或多个 ZIP 压缩包，适合批量扫描。'
                      : '上传本地目录后，系统会按相对路径还原 Skill 内容。'}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.3rem] border border-white/75 bg-white/84 p-4 dark:border-slate-700/70 dark:bg-slate-950/56">
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
                    <Button variant="outline" onClick={() => archiveInputRef.current?.click()}>
                      选择 ZIP 文件
                    </Button>
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
                    <Button variant="outline" onClick={() => directoryInputRef.current?.click()}>
                      选择文件夹
                    </Button>
                  </>
                )}

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {selectedFiles.length ? `已选 ${selectedFiles.length} 个输入项。` : '尚未选择文件。'}
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-display text-2xl text-slate-950 dark:text-slate-50">已选包</h4>
                <Badge variant="outline">{uploadMode === 'archive' ? 'ZIP 压缩包' : '文件夹'}</Badge>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-white/70 bg-white/78 p-4 dark:border-slate-700/70 dark:bg-slate-950/52">
                {selectionSummary.length ? (
                  <div className="space-y-2">
                    {selectionSummary.map((item) => (
                      <div key={item} className="text-sm leading-7 text-sky-700 dark:text-sky-300">
                        {item}
                      </div>
                    ))}
                    {selectedFiles.length > selectionSummary.length ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        另外还有 {selectedFiles.length - selectionSummary.length} 项未展开显示。
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">尚未选择任何包。</p>
                )}
              </div>
            </Card>

            <div className="skillpecker-console-submit-row">
              <Button className="skillpecker-console-submit-button" onClick={handleSubmit} disabled={createMutation.isPending}>
                <ScanSearch className="mr-2 h-4 w-4" />
                {createMutation.isPending ? '正在提交…' : '开始扫描'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="skillpecker-console-queue p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.1em] text-sky-600">实时队列</p>
            <h3 className="mt-2 font-display text-4xl text-slate-950 dark:text-slate-50">任务队列</h3>
          </div>
          <Badge variant="outline">{queueQuery.data?.jobs.length ?? 0} 个任务</Badge>
        </div>

        <div className="mt-6 space-y-4">
          {queueQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300/80 p-6 text-sm text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
              正在读取任务队列…
            </div>
          ) : queueQuery.data?.jobs.length ? (
            queueQuery.data.jobs.map((job) => (
              <Card key={job.id} className="skillpecker-queue-card p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">任务</p>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {job.createdAt ? formatDate(job.createdAt) : '等待时间戳'}
                      </span>
                    </div>
                    <p className="mt-3 break-all font-display text-3xl leading-tight text-slate-950 dark:text-slate-50">{job.id}</p>
                    <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">{getJobSummary(job)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">{job.skillCount} 个 Skill</Badge>
                      {typeof job.queuePosition === 'number' ? <Badge variant="outline">队列位置 #{job.queuePosition}</Badge> : null}
                    </div>
                  </div>

                  <div className="flex min-w-[10rem] flex-col items-start gap-3 lg:items-end">
                    <Badge variant={job.status === 'completed' ? 'succeeded' : job.status}>{getStatusLabel(job.status)}</Badge>
                    <Button variant="outline" onClick={() => openResult(job.id)}>
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
