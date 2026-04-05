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
  { index: '03', title: '查看结果', copy: '在任务队列中打开详细结论与证据。' },
]

function getJobSummary(job: { skillCount: number; summaryExcerpt?: { labelCounts: Record<string, number> } | null }) {
  if (!job.summaryExcerpt) {
    return `${job.skillCount} 个技能已提交`
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
      toast.error('请先选择包含技能的文件夹。')
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

            <div className="skillpecker-console-geometry-field" aria-hidden="true">
              <span className="skillpecker-console-geometry-grid"></span>
              <span className="skillpecker-console-geometry-orbit"></span>
              <span className="skillpecker-console-geometry-node skillpecker-console-geometry-node-a"></span>
              <span className="skillpecker-console-geometry-node skillpecker-console-geometry-node-b"></span>
              <span className="skillpecker-console-geometry-node skillpecker-console-geometry-node-c"></span>
              <span className="skillpecker-console-geometry-beam"></span>
              <span className="skillpecker-console-geometry-card skillpecker-console-geometry-card-top"></span>
              <span className="skillpecker-console-geometry-card skillpecker-console-geometry-card-bottom"></span>
            </div>
          </div>

          <div className="skillpecker-console-form skillpecker-console-form-refined">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="skillpecker-console-form-title">新建扫描任务</h3>
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
                      {uploadMode === 'archive' ? '压缩包输入' : '文件夹上传'}
                    </Badge>
                    <h4 className="skillpecker-upload-heading">{uploadMode === 'archive' ? '上传 ZIP 包' : '上传文件夹'}</h4>
                  </div>
                  <p className="skillpecker-upload-description">
                    {uploadMode === 'archive'
                      ? '可提交一个 ZIP 压缩包，包含一个或多个技能。'
                      : '可提交一个本地文件夹，系统会按相对路径恢复技能内容。'}
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
                <h4 className="skillpecker-selected-title">已选包</h4>
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
              <Button className="skillpecker-console-submit-button" onClick={handleSubmit} disabled={createMutation.isPending}>
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
