'use client'

import Link from 'next/link'
import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Library, ScanSearch, Search, X } from 'lucide-react'

import { ErrorState } from '@/components/common/error-state'
import { SkillPeckerEmptyState } from '@/components/skillpecker/skillpecker-empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSkillPeckerLibrary, useSkillPeckerLibraryDetail } from '@/lib/skillpecker/hooks'
import { SkillPeckerDecisionLevel, SkillPeckerLibraryDetail } from '@/lib/skillpecker/types'
import { cn } from '@/lib/utils'

const decisionLevelOptions = ['MALICIOUS', 'OVERREACH', 'SUSPICIOUS'] as const satisfies readonly SkillPeckerDecisionLevel[]

const decisionLabels: Record<(typeof decisionLevelOptions)[number], string> = {
  MALICIOUS: '恶意型',
  OVERREACH: '越界型',
  SUSPICIOUS: '可疑型',
}

const labelMap: Record<string, string> = {
  'access boundary risk': '权限越界',
  'active malice': '主动恶意',
  'access boundary': '权限越界',
  'privilege escalation': '权限提升',
  'permission overreach': '权限越界',
  'permission overreach (action)': '权限越界（动作）',
  'trojan downloader': '木马下载/投毒',
  'collection of web shells': 'Web Shell 收集',
  'explicit malicious activity': '显式恶意行为',
  'explicit malicious behavior': '显式恶意行为',
  'explicit malicious execution': '显式恶意执行',
  'data governance risk': '数据治理风险',
  'data over collection': '数据过度采集',
  'data over-collection': '数据过度采集',
  'privacy violation': '隐私侵犯',
  'evasion technique': '规避技术',
  'reverse shell': '反向 Shell',
  'security risk': '安全风险',
  'supply chain attack': '供应链攻击',
  'browser session or credentials': '浏览器会话或凭证',
  'browser sessions or credentials': '浏览器会话或凭证',
  'filesystem access': '文件系统访问',
  'credential request': '凭证请求',
  'browser automation': '浏览器自动化',
  'cookie access': 'Cookie 访问',
  'secret access': '敏感信息访问',
  'env access': '环境变量访问',
  'environment variable access': '环境变量访问',
  'network access': '网络访问',
  'external communication': '外部通信',
  'external communications': '外部通信',
  'execution / system risk': '执行/系统风险',
  'execution/system risk': '执行/系统风险',
  'execution system risk': '执行/系统风险',
  'remote command execution': '远程命令执行',
  'shell or command execution': '命令执行',
  'obfuscated execution': '混淆执行',
  'credential access': '凭证访问',
  'data exfiltration': '数据外传',
  'file exfiltration': '文件外传',
  'destructive operation': '破坏性操作',
  'privacy leakage': '隐私泄露',
  'application marketplace': '应用市场',
  marketplace: '应用市场',
  market: '应用市场',
  'description scan': '描述扫描',
  'script scan': '脚本扫描',
  'allowed-tools': '允许工具',
  'allowed tools': '允许工具',
  'review process': '审查流程',
  purpose: '用途',
  overview: '概览',
  capabilities: '能力',
  metadata: '元数据',
  specialization: '专长',
  domain: '领域',
  category: '分类',
  phase: '阶段',
  abstract: '摘要',
  introduction: '引言',
  methods: '方法',
  read: '读取',
  write: '写入',
  edit: '编辑',
  glob: '通配匹配',
  grep: '文本搜索',
  bash: '命令执行',
  academic: '学术',
  test: '测试',
  testing: '测试',
  'testing security': '测试安全',
  research: '研究',
  education: '教育',
  security: '安全',
  finance: '金融',
  investment: '投资',
  unknown: '未知',
  'ai engineering': 'AI 工程',
  'architecture patterns': '架构模式',
  'astronomy physics': '天体物理',
  'automation tools': '自动化工具',
  backend: '后端',
  bioinformatics: '生物信息',
  blockchain: '区块链',
  business: '商业',
  'business apps': '商业应用',
  cicd: '持续集成/持续交付',
  'cli tools': '命令行工具',
  'cms platforms': 'CMS 平台',
  'code quality': '代码质量',
  'computational chemistry': '计算化学',
  'content media': '内容媒体',
  'data ai': '数据与 AI',
  databases: '数据库',
  debugging: '调试',
  design: '设计',
  development: '开发',
  devops: '运维',
  operations: '运维',
  productivity: '办公生产力',
  'productivity tools': '办公生产力工具',
  documentation: '文档',
  documents: '文稿',
  'domain utilities': '域名工具',
  ecommerce: '电商',
  'ecommerce development': '电商开发',
  examples: '示例',
  'finance investment': '金融投资',
  fixtures: '测试样例',
  'framework internals': '框架内部',
  frontend: '前端',
  gaming: '游戏',
  'health fitness': '健康健身',
  'ide plugins': 'IDE 插件',
  'knowledge base': '知识库',
  'lab tools': '实验工具',
  lifestyle: '生活方式',
  'literature writing': '文学写作',
  'llm ai': '大模型 AI',
  media: '媒体',
  mobile: '移动端',
  monitoring: '监控',
  'package distribution': '包分发',
  'project management': '项目管理',
  'scientific computing': '科学计算',
  scripting: '脚本',
  shelby: 'Shelby',
  skills: '技能',
  'skills index': '技能索引',
  'smart contracts': '智能合约',
  'stack evaluation': '技术栈评估',
  'technical docs': '技术文档',
  'test fixtures': '测试样例',
  office: '办公',
  general: '通用',
  utility: '工具',
  tools: '工具',
  'wellness health': '健康养生',
  malicious: '恶意型',
  overreach: '越界型',
  suspicious: '可疑型',
  safe: '安全型',
  other: '其他',
  apikey: 'API 密钥',
  'shell/命令执行': 'Shell/命令执行',
  'driver/installer': '驱动/安装器',
  'external server': '外部服务器',
  'browser session/credentials': '浏览器会话/凭据',
  'persistent/external storage': '持久化/外部存储',
  'obfuscation/evasion': '混淆/规避',
  'autonomous execution': '自治执行',
  '外部服务器': '外部服务器',
  '浏览器会话/凭据': '浏览器会话/凭据',
  '文件系统访问': '文件系统访问',
  'api key': 'API 密钥',
  '驱动/安装器': '驱动/安装器',
  '凭据请求': '凭据请求',
  '混淆/规避': '混淆/规避',
  '持久化/外部存储': '持久化/外部存储',
  '自治执行': '自治执行',
}

const labelTokenMap: Record<string, string> = {
  access: '访问',
  automation: '自动化',
  bash: '命令执行',
  browser: '浏览器',
  collection: '采集',
  command: '命令',
  commands: '命令',
  cookie: 'Cookie',
  cookies: 'Cookie',
  credential: '凭证',
  credentials: '凭证',
  data: '数据',
  environment: '环境',
  env: '环境',
  escalation: '提升',
  execution: '执行',
  explicit: '显式',
  external: '外部',
  file: '文件',
  filesystem: '文件系统',
  governance: '治理',
  malicious: '恶意',
  network: '网络',
  obfuscated: '混淆',
  operation: '操作',
  over: '过度',
  overreach: '越界',
  permission: '权限',
  permissions: '权限',
  privilege: '权限',
  privacy: '隐私',
  read: '读取',
  remote: '远程',
  request: '请求',
  requests: '请求',
  risk: '风险',
  secret: '敏感信息',
  session: '会话',
  sessions: '会话',
  shell: '命令',
  suspicious: '可疑',
  system: '系统',
  tools: '工具',
  trojan: '木马',
  variable: '变量',
  variables: '变量',
  write: '写入',
  edit: '编辑',
  grep: '文本搜索',
  glob: '通配匹配',
  or: '或',
  and: '和',
}

type LibraryRecord = {
  classification?: {
    decision_level?: string
    primary_group?: string
    platform?: string
    related_file_count?: string | number
    problem_summary?: string
    cleaned_description?: string
    raw_verdict?: string
    risk_types?: string[]
    flags?: Record<string, boolean>
    scan_level?: string
  }
}

type LibraryJudgeFinding = {
  summary: string
  decisionLevel?: string
  primaryGroup?: string
  sourcePlatform?: string
  sourceFile?: string
  impact?: string
}

type DocSummarySection = {
  heading?: string
  lines: string[]
}

function normalizeLabel(value?: string) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function translateKnownLabel(value?: string, fallback = '-') {
  const normalized = normalizeLabel(value)
  if (!normalized) {
    return fallback
  }

  const mapped = labelMap[normalized.toLowerCase()]
  if (mapped) {
    return mapped
  }

  const segments = normalized.split(/(\s+|\/|,|:|\(|\)|\||-)/g)
  let translatedCount = 0
  let untranslatedAlphaCount = 0

  const translated = segments
    .map((segment) => {
      if (!segment) {
        return segment
      }

      if (/^\s+$/.test(segment)) {
        return ''
      }

      if (/^[\/,:()|-]$/.test(segment)) {
        return segment
      }

      const token = segment.toLowerCase()
      const tokenMapped = labelTokenMap[token]
      if (tokenMapped) {
        translatedCount += 1
        return tokenMapped
      }

      if (/^[a-z]+$/i.test(segment)) {
        untranslatedAlphaCount += 1
      }

      return segment
    })
    .join('')
    .trim()

  if (translatedCount > 0 && untranslatedAlphaCount === 0) {
    return translated
  }

  return normalized || fallback
}

function toText(value: unknown, fallback = '-') {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || fallback
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.path === 'string' && typeof record.why === 'string') {
      return `${record.path}: ${record.why}`
    }
    if (typeof record.why === 'string') {
      return record.why
    }
    if (typeof record.path === 'string') {
      return record.path
    }
  }

  return fallback
}

function formatDecisionLevel(level?: string) {
  if (level === 'MALICIOUS') return '恶意型'
  if (level === 'OVERREACH') return '越界型'
  if (level === 'SUSPICIOUS') return '可疑型'
  if (level === 'SAFE') return '安全型'
  return level || '未知'
}

function findingVariant(level?: string): 'high' | 'medium' | 'low' | 'unknown' {
  if (level === 'MALICIOUS') return 'high'
  if (level === 'OVERREACH' || level === 'SUSPICIOUS') return 'medium'
  if (level === 'SAFE') return 'low'
  return 'unknown'
}

function extractScanRecords(detail?: SkillPeckerLibraryDetail): LibraryRecord[] {
  const scanResult = detail?.scanResult as
    | {
        excel_import?: {
          records?: LibraryRecord[]
        }
      }
    | undefined

  return scanResult?.excel_import?.records ?? []
}

function extractFindings(detail?: SkillPeckerLibraryDetail): LibraryJudgeFinding[] {
  const rawFindings = detail?.judge?.top_findings ?? []

  return rawFindings.map((item) => {
    const finding = item as Record<string, unknown>

    return {
      summary: toText(finding.summary, '该样本存在需要重点关注的安全问题。'),
      decisionLevel: typeof finding.decision_level === 'string' ? finding.decision_level : undefined,
      primaryGroup: typeof finding.primary_group === 'string' ? finding.primary_group : undefined,
      sourcePlatform: typeof finding.source_platform === 'string' ? finding.source_platform : undefined,
      sourceFile: typeof finding.source_file === 'string' ? finding.source_file : undefined,
      impact: toText(finding.impact, ''),
    }
  })
}

function formatCategoryName(value?: string) {
  return translateKnownLabel(value, '未分类')
}

function formatSkillName(value: string) {
  return value.replace(/^unknown__+/i, '') || value
}

function hasMeaningfulText(value?: string) {
  const text = String(value || '').trim()
  return Boolean(text && text !== '-' && text.toLowerCase() !== 'no description available')
}

function stripLeadingMetadataLines(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const filtered: string[] = []
  let index = 0

  if (lines[index]?.trim() === '---') {
    filtered.push(lines[index])
    index += 1

    while (index < lines.length && lines[index].trim() !== '---') {
      const line = lines[index]
      if (!/^\s*(name|description)\s*:/i.test(line)) {
        filtered.push(line)
      }
      index += 1
    }

    if (index < lines.length) {
      filtered.push(lines[index])
      index += 1
    }
  }

  while (index < lines.length) {
    const line = lines[index]
    if (!filtered.length && /^\s*(name|description)\s*:/i.test(line)) {
      index += 1
      continue
    }
    filtered.push(line)
    index += 1
  }

  return filtered.join('\n').trim()
}

function extractMarkdownSummary(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const summarySections: DocSummarySection[] = []
  const bodyLines: string[] = []
  let index = 0

  const pushField = (label: string, value: string) => {
    summarySections.push({
      heading: label,
      lines: value ? [value] : [],
    })
  }

  if (lines[index]?.trim() === '---') {
    index += 1
    while (index < lines.length && lines[index].trim() !== '---') {
      const line = lines[index]
      const fieldMatch = line.match(/^\s*([^:]+):\s*(.*)$/)
      if (fieldMatch) {
        const label = fieldMatch[1].trim()
        const value = fieldMatch[2].trim()
        if (!/^(name|description)$/i.test(label)) {
          pushField(label, value)
        }
      }
      index += 1
    }

    if (index < lines.length && lines[index].trim() === '---') {
      index += 1
    }
  }

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!bodyLines.length) {
      if (!trimmed) {
        index += 1
        continue
      }

      if (/^#{1,6}\s+/.test(trimmed)) {
        bodyLines.push(...lines.slice(index))
        break
      }

      const fieldMatch = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
      if (fieldMatch) {
        const label = fieldMatch[1].trim()
        const value = fieldMatch[2].trim()
        if (!/^(name|description)$/i.test(label)) {
          pushField(label, value)
        }
        index += 1
        continue
      }

      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)
      if (bulletMatch && summarySections.length) {
        summarySections[summarySections.length - 1].lines.push(bulletMatch[1])
        index += 1
        continue
      }
    }

    bodyLines.push(...lines.slice(index))
    break
  }

  return {
    summarySections: summarySections.filter((section) => section.lines.length || section.heading),
    body: stripLeadingMetadataLines(bodyLines.join('\n')),
  }
}

function isMarkdownTableSeparator(line: string) {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) {
    return false
  }

  return trimmed
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
    .every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isMarkdownTableRow(line: string) {
  const trimmed = line.trim()
  return Boolean(trimmed.includes('|') && !trimmed.startsWith('```'))
}

function splitMarkdownTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="skillpecker-markdown-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="skillpecker-markdown-link"
        >
          {linkMatch[1]}
        </a>
      )
    }

    return <Fragment key={index}>{part}</Fragment>
  })
}

function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.split('\n')
  const nodes: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) {
      i += 1
      continue
    }

    if (line === '---') {
      nodes.push(<hr key={`hr-${i}`} className="skillpecker-markdown-divider" />)
      i += 1
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      const language = line.slice(3).trim()
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i += 1
      }
      if (i < lines.length) {
        i += 1
      }

      nodes.push(
        <pre key={`code-${i}`} className="skillpecker-markdown-codeblock">
          {language ? <span className="skillpecker-markdown-code-lang">{language}</span> : null}
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    if (i + 1 < lines.length && isMarkdownTableRow(line) && isMarkdownTableSeparator(lines[i + 1])) {
      const header = splitMarkdownTableRow(line)
      const body: string[][] = []
      i += 2

      while (i < lines.length) {
        const nextLine = lines[i].trim()
        if (!nextLine || !isMarkdownTableRow(nextLine) || isMarkdownTableSeparator(nextLine)) {
          break
        }
        body.push(splitMarkdownTableRow(nextLine))
        i += 1
      }

      nodes.push(
        <div key={`table-${i}`} className="skillpecker-markdown-table-wrap">
          <table className="skillpecker-markdown-table">
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index}>{renderInlineMarkdown(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {header.map((_, colIndex) => (
                    <td key={colIndex}>{renderInlineMarkdown(row[colIndex] || '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = headingMatch[2]
      const className = `skillpecker-markdown-heading skillpecker-markdown-heading-${level}`

      if (level === 1) nodes.push(<h1 key={`h1-${i}`} className={className}>{renderInlineMarkdown(content)}</h1>)
      else if (level === 2) nodes.push(<h2 key={`h2-${i}`} className={className}>{renderInlineMarkdown(content)}</h2>)
      else if (level === 3) nodes.push(<h3 key={`h3-${i}`} className={className}>{renderInlineMarkdown(content)}</h3>)
      else if (level === 4) nodes.push(<h4 key={`h4-${i}`} className={className}>{renderInlineMarkdown(content)}</h4>)
      else if (level === 5) nodes.push(<h5 key={`h5-${i}`} className={className}>{renderInlineMarkdown(content)}</h5>)
      else nodes.push(<h6 key={`h6-${i}`} className={className}>{renderInlineMarkdown(content)}</h6>)

      i += 1
      continue
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/)
    if (unorderedMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const match = lines[i].trim().match(/^[-*]\s+(.*)$/)
        if (!match) break
        items.push(match[1])
        i += 1
      }
      nodes.push(
        <ul key={`ul-${i}`} className="skillpecker-markdown-list">
          {items.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const match = lines[i].trim().match(/^\d+\.\s+(.*)$/)
        if (!match) break
        items.push(match[1])
        i += 1
      }
      nodes.push(
        <ol key={`ol-${i}`} className="skillpecker-markdown-list skillpecker-markdown-ordered">
          {items.map((item, index) => (
            <li key={index}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    const paragraphLines = [line]
    i += 1
    while (i < lines.length) {
      const next = lines[i].trim()
      if (!next || next === '---' || next.startsWith('#') || next.startsWith('```') || /^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next)) {
        break
      }
      paragraphLines.push(next)
      i += 1
    }

    nodes.push(
      <p key={`p-${i}`} className="skillpecker-markdown-paragraph">
        {renderInlineMarkdown(paragraphLines.join(' '))}
      </p>
    )
  }

  return nodes
}

function MarkdownDocument({
  markdown,
  className,
}: {
  markdown: string
  className?: string
}) {
  return <div className={cn('skillpecker-markdown-doc', className)}>{renderMarkdown(markdown)}</div>
}

function SkillDocumentSummary({
  name,
  description,
  sections,
}: {
  name: string
  description?: string
  sections: DocSummarySection[]
}) {
  return (
    <div className="skillpecker-library-doc-summary">
      <div className="skillpecker-library-doc-summary-item">
        <span>名称</span>
        <strong>{name}</strong>
      </div>
      <div className="skillpecker-library-doc-summary-item">
        <span>描述</span>
        <strong>{description?.trim() || '暂无描述。'}</strong>
      </div>
      {sections.map((section, index) => (
        <div key={`${section.heading || 'section'}-${index}`} className="skillpecker-library-doc-summary-item">
          {section.heading ? <span>{translateKnownLabel(section.heading, section.heading)}</span> : null}
          {section.lines.map((line, lineIndex) => (
            <strong key={lineIndex} className="skillpecker-library-doc-summary-line">
              {line}
            </strong>
          ))}
        </div>
      ))}
    </div>
  )
}

function LibraryScanRecord({ record }: { record: LibraryRecord }) {
  const info = record.classification || {}
  const displaySummary = info.problem_summary || info.cleaned_description || info.raw_verdict || '暂无结论摘要。'
  const riskTypes = Array.isArray(info.risk_types) ? info.risk_types : []
  const flags = Object.entries(info.flags || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => translateKnownLabel(key, normalizeLabel(key)))

  return (
    <article className="skillpecker-library-record-card">
      <div className="skillpecker-library-record-head">
        <div>
          <h5>{translateKnownLabel(info.scan_level, '扫描记录')}</h5>
        </div>
        <span className={cn('skillpecker-library-decision-pill', `is-${String(info.decision_level || '').toLowerCase()}`)}>
          {formatDecisionLevel(info.decision_level)}
        </span>
      </div>

      <div className="skillpecker-library-audit-grid">
        <div className="skillpecker-library-audit-item">
          <span>判定级别</span>
          <strong>{formatDecisionLevel(info.decision_level)}</strong>
        </div>
        <div className="skillpecker-library-audit-item">
          <span>主风险组</span>
          <strong>{translateKnownLabel(info.primary_group)}</strong>
        </div>
        <div className="skillpecker-library-audit-item">
          <span>来源平台</span>
          <strong>{translateKnownLabel(info.platform)}</strong>
        </div>
        <div className="skillpecker-library-audit-item">
          <span>关联文件</span>
          <strong>{toText(info.related_file_count)}</strong>
        </div>
      </div>

      <div className="skillpecker-library-audit-section">
        <span className="skillpecker-finding-record-label">问题描述</span>
        <div className="skillpecker-library-summary-box">
          <MarkdownDocument markdown={displaySummary} className="skillpecker-library-problem-doc" />
        </div>
      </div>

      {riskTypes.length ? (
        <div className="skillpecker-library-audit-section">
          <span className="skillpecker-finding-record-label">风险类型</span>
          <div className="skillpecker-library-chip-row">
            {riskTypes.map((item) => (
              <span key={item} className="skillpecker-detail-chip skillpecker-library-meta-chip">
                {translateKnownLabel(item, item)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {flags.length ? (
        <div className="skillpecker-library-audit-section">
          <span className="skillpecker-finding-record-label">触发标记</span>
          <div className="skillpecker-library-chip-row">
            {flags.map((item) => (
              <span key={item} className="skillpecker-detail-chip skillpecker-detail-chip-warn skillpecker-library-meta-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

function LibraryFindingCard({ finding }: { finding: LibraryJudgeFinding }) {
  return (
    <article className="skillpecker-library-record-card">
      <div className="skillpecker-library-record-head">
        <div>
          <h5>{finding.summary}</h5>
        </div>
        {finding.decisionLevel ? (
          <Badge variant={findingVariant(finding.decisionLevel)} className="skillpecker-library-finding-badge">
            {formatDecisionLevel(finding.decisionLevel)}
          </Badge>
        ) : null}
      </div>

      <div className="skillpecker-library-chip-row">
        {finding.primaryGroup ? (
          <span className="skillpecker-detail-chip skillpecker-library-meta-chip">主风险组 {translateKnownLabel(finding.primaryGroup)}</span>
        ) : null}
        {finding.sourcePlatform ? (
          <span className="skillpecker-detail-chip skillpecker-library-meta-chip">来源 {translateKnownLabel(finding.sourcePlatform)}</span>
        ) : null}
        {finding.sourceFile ? (
          <span className="skillpecker-detail-chip skillpecker-library-meta-chip">文件 {finding.sourceFile}</span>
        ) : null}
      </div>

      {finding.impact ? (
        <div className="skillpecker-library-audit-section">
          <span className="skillpecker-finding-record-label">影响说明</span>
          <div className="skillpecker-library-summary-box">
            <MarkdownDocument markdown={finding.impact} className="skillpecker-library-problem-doc" />
          </div>
        </div>
      ) : null}
    </article>
  )
}

export function SkillPeckerLibrary() {
  const [draftQuery, setDraftQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [draftDecisionLevels, setDraftDecisionLevels] = useState<SkillPeckerDecisionLevel[]>([])
  const [submittedDecisionLevels, setSubmittedDecisionLevels] = useState<SkillPeckerDecisionLevel[]>([])
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string>()
  const [docPanelHeight, setDocPanelHeight] = useState<number>()
  const scanPanelRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setPage(1)
    setExpandedId(undefined)
  }, [submittedDecisionLevels, submittedQuery])

  const libraryQuery = useSkillPeckerLibrary({
    page,
    pageSize: 12,
    query: submittedQuery,
    decisionLevels: submittedDecisionLevels,
  })
  const libraryDetailQuery = useSkillPeckerLibraryDetail(expandedId)

  useEffect(() => {
    if (!expandedId || !scanPanelRef.current) {
      setDocPanelHeight(undefined)
      return
    }

    const element = scanPanelRef.current
    const updateHeight = () => {
      setDocPanelHeight(element.getBoundingClientRect().height)
    }

    updateHeight()
    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(element)

    return () => observer.disconnect()
  }, [expandedId, libraryDetailQuery.data, libraryDetailQuery.isLoading])

  const hasPendingSearch = useMemo(() => {
    const levelKey = (values: SkillPeckerDecisionLevel[]) => [...values].sort().join('|')
    return draftQuery.trim() !== submittedQuery || levelKey(draftDecisionLevels) !== levelKey(submittedDecisionLevels)
  }, [draftDecisionLevels, draftQuery, submittedDecisionLevels, submittedQuery])

  const toggleDecisionLevel = (value: SkillPeckerDecisionLevel) => {
    setDraftDecisionLevels((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  const handleSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setSubmittedQuery(draftQuery.trim())
    setSubmittedDecisionLevels([...draftDecisionLevels].sort() as SkillPeckerDecisionLevel[])
  }

  if (libraryQuery.error) {
    return <ErrorState title="恶意 Skill 库加载失败" message="请稍后重试或联系管理员。" onRetry={() => libraryQuery.refetch()} />
  }

  const detail = libraryDetailQuery.data
  const scanRecords = extractScanRecords(detail)
  const findings = extractFindings(detail)
  const isSearching = libraryQuery.isFetching
  const docSummary = useMemo(() => {
    if (!detail?.item.docPreview) {
      return { summarySections: [], body: '' }
    }
    return extractMarkdownSummary(detail.item.docPreview)
  }, [detail?.item.docPreview])
  const totalPages = libraryQuery.data?.totalPages || 1
  const pageItems = useMemo(() => {
    const items: Array<number | 'ellipsis'> = []
    const pushPage = (value: number | 'ellipsis') => {
      if (items[items.length - 1] !== value) {
        items.push(value)
      }
    }

    if (totalPages <= 7) {
      for (let value = 1; value <= totalPages; value += 1) {
        pushPage(value)
      }
      return items
    }

    pushPage(1)
    if (page > 3) pushPage('ellipsis')
    for (let value = Math.max(2, page - 1); value <= Math.min(totalPages - 1, page + 1); value += 1) {
      pushPage(value)
    }
    if (page < totalPages - 2) pushPage('ellipsis')
    pushPage(totalPages)
    return items
  }, [page, totalPages])

  return (
    <div className="skillpecker-library-stack">
      <Card className="skillpecker-library-search-shell">
        <form className="skillpecker-library-search-bar" onSubmit={handleSubmit}>
          <div className="skillpecker-library-search-main">
            <div className="skillpecker-library-search-input-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="按技能名称搜索..."
                  className="skillpecker-library-search-input pl-11 pr-16"
                />
                {draftQuery ? (
                  <button
                    type="button"
                    className="skillpecker-library-search-clear"
                    aria-label="清空搜索内容"
                    onClick={() => setDraftQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="skillpecker-library-search-filter-row">
              <span className="skillpecker-library-filter-label">判定级别</span>
              <div className="skillpecker-library-filter-group">
                {decisionLevelOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn('skillpecker-library-filter-chip', draftDecisionLevels.includes(item) && 'is-active')}
                    onClick={() => toggleDecisionLevel(item)}
                  >
                    {decisionLabels[item]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="skillpecker-library-search-actions">
            <Button type="submit" variant="secondary" className="skillpecker-library-search-button" disabled={isSearching && !hasPendingSearch}>
              {isSearching ? (
                <span className="skillpecker-library-search-loading" aria-live="polite">
                  <span className="skillpecker-library-search-equalizer" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  搜索中
                </span>
              ) : (
                '搜索'
              )}
            </Button>
          </div>
        </form>

        {hasPendingSearch ? <p className="skillpecker-library-search-hint">筛选条件已更新，点击“搜索”或按回车键生效。</p> : null}
      </Card>

      {libraryQuery.isLoading ? (
        <Card className="rounded-[2rem] p-6 text-sm text-slate-500 dark:text-slate-400">正在加载恶意 Skill 库...</Card>
      ) : libraryQuery.data?.items.length ? (
        <div className="skillpecker-library-results">
          {libraryQuery.data.items.map((item, index) => {
            const expanded = expandedId === item.id
            const displayName = formatSkillName(item.name)
            const hasDescription = hasMeaningfulText(item.description)

            return (
              <Card
                key={item.id}
                className={cn('skillpecker-library-card', expanded && 'is-active')}
                style={{ ['--library-stagger' as string]: `${index}` }}
              >
                <div className="skillpecker-library-card-trigger">
                  <div className="skillpecker-library-card-main">
                    <div className="skillpecker-library-title-row">
                      <h3 className="skillpecker-library-title">{displayName}</h3>
                      <span className="skillpecker-library-category-chip">{formatCategoryName(item.businessCategory)}</span>
                    </div>
                    {hasDescription ? <p className="skillpecker-library-description">{item.description}</p> : null}
                    {item.url ? (
                      <Link href={item.url} target="_blank" className="skillpecker-library-link">
                        {item.url}
                      </Link>
                    ) : null}
                  </div>

                  <div className="skillpecker-library-actions">
                    {item.primaryDecisionLevel ? (
                      <span className={cn('skillpecker-library-decision-pill', `is-${item.primaryDecisionLevel.toLowerCase()}`)}>
                        {formatDecisionLevel(item.primaryDecisionLevel)}
                      </span>
                    ) : null}
                    <Button
                      variant="outline"
                      className={cn('skillpecker-library-expand-button', expanded && 'is-active')}
                      onClick={() => setExpandedId(expanded ? undefined : item.id)}
                    >
                      {expanded ? '收起详情' : '查看详情'}
                    </Button>
                  </div>
                </div>

                {expanded ? (
                  <div className="skillpecker-library-card-body">
                    <div
                      className={cn(
                        'skillpecker-library-expanded-grid',
                        !(detail?.item.hasSkillDoc && detail?.item.docPreview) && 'is-single-column'
                      )}
                    >
                      <section className="skillpecker-library-expanded-main">
                        <section ref={scanPanelRef} className="skillpecker-library-detail-block glass-panel">
                          <div className="subpanel-head skillpecker-library-panel-head">
                            <div className="flex items-center gap-3">
                              <ScanSearch className="h-5 w-5 text-sky-500" />
                              <h4>扫描结果</h4>
                            </div>
                          </div>
                          <div className="skillpecker-library-record-list">
                            {libraryDetailQuery.isLoading ? (
                              <div className="skillpecker-library-empty">正在加载扫描详情...</div>
                            ) : scanRecords.length ? (
                              scanRecords.map((record, recordIndex) => <LibraryScanRecord key={`${item.id}-${recordIndex}`} record={record} />)
                            ) : findings.length ? (
                              findings.map((finding, findingIndex) => <LibraryFindingCard key={`${item.id}-finding-${findingIndex}`} finding={finding} />)
                            ) : (
                              <div className="skillpecker-library-empty">该 Skill 暂无可展示的扫描记录。</div>
                            )}
                          </div>
                        </section>
                      </section>

                      {detail?.item.hasSkillDoc && detail?.item.docPreview ? (
                        <aside className="skillpecker-library-expanded-side">
                          <section
                            className="skillpecker-library-detail-block skillpecker-library-doc-panel glass-panel"
                            style={docPanelHeight ? { height: docPanelHeight, maxHeight: docPanelHeight } : undefined}
                          >
                            <div className="subpanel-head skillpecker-library-panel-head">
                              <div className="flex items-center gap-3">
                                <Library className="h-5 w-5 text-sky-500" />
                                <h4>技能文档</h4>
                              </div>
                            </div>
                            <div className="skillpecker-library-doc-code">
                              <SkillDocumentSummary name={displayName} description={item.description} sections={docSummary.summarySections} />
                              <MarkdownDocument markdown={docSummary.body} />
                            </div>
                          </section>
                        </aside>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </Card>
            )
          })}

          <div className="skillpecker-library-pagination">
            <p className="skillpecker-library-pagination-status text-slate-500 dark:text-slate-400">
              第 {libraryQuery.data.page} / {Math.max(libraryQuery.data.totalPages, 1)} 页
            </p>
            <div className="skillpecker-library-pagination-controls">
              <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                上一页
              </Button>
              <div className="skillpecker-library-page-list" aria-label="分页页码">
                {pageItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="skillpecker-library-page-ellipsis">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={cn('skillpecker-library-page-button', item === page && 'is-active')}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setPage((current) => (libraryQuery.data.totalPages ? Math.min(libraryQuery.data.totalPages, current + 1) : current))
                }
                disabled={!libraryQuery.data.totalPages || page >= libraryQuery.data.totalPages}
              >
                下一页
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <SkillPeckerEmptyState
          title={submittedQuery || submittedDecisionLevels.length ? '没有匹配的样本' : '样本库为空'}
          description={
            submittedQuery || submittedDecisionLevels.length
              ? '调整关键词或判定级别筛选后再试。'
              : '当前恶意 Skill 库中还没有可展示的数据。'
          }
        />
      )}
    </div>
  )
}
