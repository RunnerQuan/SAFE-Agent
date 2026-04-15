import type { LogEntry } from '@/lib/types'

type SanitizeLogOptions = {
  projectRoot?: string
  workspaceRoot?: string
  userHome?: string
}

const WINDOWS_ABSOLUTE_PATH = /[A-Za-z]:(?:[\\/][^\\/:*?"<>|\r\n]+)+/g
const POSIX_SENSITIVE_PATH = /\/(?:Users|home|var|tmp|private|opt|Volumes|mnt)(?:\/[^\s"',]+)+/g

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceKnownPath(text: string, target: string | undefined, replacement: string) {
  if (!target) {
    return text
  }

  const variants = Array.from(
    new Set([
      target,
      target.replace(/\//g, '\\'),
      target.replace(/\\/g, '/'),
      target.replace(/\\/g, '\\\\'),
      target.replace(/\//g, '\\/'),
    ])
  ).sort((left, right) => right.length - left.length)

  let result = text
  for (const variant of variants) {
    result = result.replace(new RegExp(escapeRegExp(variant), 'g'), replacement)
  }
  return result
}

export function sanitizeLogMessage(message: string, options: SanitizeLogOptions = {}) {
  let sanitized = message

  sanitized = replaceKnownPath(sanitized, options.workspaceRoot, '<workspace>')
  sanitized = replaceKnownPath(sanitized, options.projectRoot, '<project>')
  sanitized = replaceKnownPath(sanitized, options.userHome, '<user-home>')

  sanitized = sanitized.replace(WINDOWS_ABSOLUTE_PATH, '<path>')
  sanitized = sanitized.replace(POSIX_SENSITIVE_PATH, '<path>')

  return sanitized
}

export function sanitizeLogEntry(entry: LogEntry, options: SanitizeLogOptions = {}): LogEntry {
  return {
    ...entry,
    message: sanitizeLogMessage(entry.message, options),
  }
}
