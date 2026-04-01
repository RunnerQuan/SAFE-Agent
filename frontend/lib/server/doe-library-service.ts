import 'server-only'

import fs from 'node:fs/promises'
import path from 'node:path'

import type { DoeLibraryCase, DoeLibraryTranscriptItem } from '@/lib/types'

const FRONTEND_ROOT = process.cwd()
const PROJECT_ROOT = path.resolve(FRONTEND_ROOT, '..')
const DOE_LIBRARY_ROOT = path.join(PROJECT_ROOT, 'backend', 'agentRaft', 'DOE library')

type JudgeResultShape = {
  task?: string
  res?: {
    'data-overexposure'?: boolean
    analysis_reason?: string
    Allowed_Fields?: string[]
    Leaked_Fields?: string[]
  }
}

type EvaluationMessage = {
  role?: string
  content?: unknown
  tool_calls?: Array<{
    function?: string
    args?: Record<string, unknown>
  }>
}

type EvaluationRun = {
  suite_name?: string
  pipeline_name?: string
  user_task_id?: string
  utility?: boolean
  security?: boolean
  duration?: number
  messages?: EvaluationMessage[]
}

function extractJsonText(raw: string) {
  const cleaned = raw.replace(/\uFEFF/g, '').replace(/\r/g, '').trim()
  const withoutTrailingComma = cleaned.replace(/,\s*$/, '')
  return withoutTrailingComma.replace(/,\s*([}\]])/g, '$1')
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

async function readJudgeResult(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(extractJsonText(content)) as JudgeResultShape
  } catch {
    return null
  }
}

function parseFolderName(folderName: string) {
  const match = folderName.match(/^(.*)_(agentRaft(?:_[A-Za-z]+(?:_\d+)?)?)_(user_task_\d+)$/)
  if (!match) {
    return {
      pipelineName: folderName,
      scenarioName: 'agentRaft',
      userTaskId: folderName,
    }
  }

  return {
    pipelineName: match[1],
    scenarioName: match[2],
    userTaskId: match[3],
  }
}

function extractContentText(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object' && typeof (item as { content?: unknown }).content === 'string') {
          return String((item as { content: string }).content)
        }

        return ''
      })
      .join('\n')
      .trim()
  }

  return ''
}

function buildTranscriptPreview(messages: EvaluationMessage[]) {
  const preview: DoeLibraryTranscriptItem[] = []

  for (const message of messages) {
    const text = extractContentText(message.content)
    if (!text) {
      continue
    }

    preview.push({
      role: message.role || 'unknown',
      text,
    })

    if (preview.length >= 5) {
      break
    }
  }

  return preview
}

function getUserPrompt(messages: EvaluationMessage[]) {
  return (
    messages.find((message) => message.role === 'user' && extractContentText(message.content)) &&
    extractContentText(messages.find((message) => message.role === 'user')?.content)
  ) || ''
}

function getToolSequence(messages: EvaluationMessage[]) {
  const sequence: string[] = []

  for (const message of messages) {
    for (const toolCall of message.tool_calls ?? []) {
      if (typeof toolCall.function === 'string' && toolCall.function.trim()) {
        sequence.push(toolCall.function)
      }
    }
  }

  return sequence
}

function getLastToolOutput(messages: EvaluationMessage[]) {
  const toolMessages = [...messages].reverse().find((message) => message.role === 'tool')
  const text = extractContentText(toolMessages?.content)
  return text || undefined
}

async function findFirstFile(root: string, filename: string): Promise<string | null> {
  const entries = await fs.readdir(root, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isFile() && entry.name === filename) {
      return fullPath
    }

    if (entry.isDirectory()) {
      const nested: string | null = await findFirstFile(fullPath, filename)
      if (nested) {
        return nested
      }
    }
  }

  return null
}

export async function listDoeLibraryCases(): Promise<DoeLibraryCase[]> {
  const entries = await fs.readdir(DOE_LIBRARY_ROOT, { withFileTypes: true }).catch(() => [])

  const cases = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const folderPath = path.join(DOE_LIBRARY_ROOT, entry.name)
        const evaluationPath = await findFirstFile(folderPath, 'none.json')
        if (!evaluationPath) {
          return null
        }

        const evaluation = await readJsonFile<EvaluationRun>(evaluationPath)
        if (!evaluation) {
          return null
        }

        const judgeResultPath = await findFirstFile(folderPath, 'judgeRes.txt')
        const judgeResult = judgeResultPath ? await readJudgeResult(judgeResultPath) : null
        const messages = Array.isArray(evaluation.messages) ? evaluation.messages : []
        const toolSequence = getToolSequence(messages)
        const parsedFolder = parseFolderName(entry.name)

        const libraryCase: DoeLibraryCase = {
          id: entry.name,
          folderName: entry.name,
          pipelineName: evaluation.pipeline_name || parsedFolder.pipelineName,
          suiteName: evaluation.suite_name || 'agentRaft',
          scenarioName: parsedFolder.scenarioName,
          userTaskId: evaluation.user_task_id || parsedFolder.userTaskId,
          hasJudgeResult: Boolean(judgeResult),
          verdict: judgeResult?.res?.['data-overexposure'],
          utility: typeof evaluation.utility === 'boolean' ? evaluation.utility : null,
          security: typeof evaluation.security === 'boolean' ? evaluation.security : null,
          durationSeconds: typeof evaluation.duration === 'number' ? evaluation.duration : null,
          messageCount: messages.length,
          toolSequence,
          uniqueTools: Array.from(new Set(toolSequence)),
          userPrompt: getUserPrompt(messages),
          finalAction: toolSequence[toolSequence.length - 1],
          lastToolOutput: getLastToolOutput(messages),
          analysisReason: judgeResult?.res?.analysis_reason,
          allowedFields: Array.isArray(judgeResult?.res?.Allowed_Fields) ? judgeResult!.res!.Allowed_Fields! : [],
          leakedFields: Array.isArray(judgeResult?.res?.Leaked_Fields) ? judgeResult!.res!.Leaked_Fields! : [],
          transcriptPreview: buildTranscriptPreview(messages),
          raw: {
            evaluation,
            judgeResult,
          },
        }

        return libraryCase
      })
  )

  return cases
    .filter((item): item is DoeLibraryCase => item !== null)
    .sort((left, right) => left.folderName.localeCompare(right.folderName))
}
