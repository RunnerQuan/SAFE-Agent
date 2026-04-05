'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
  title: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  gradient?: boolean
  descriptionClassName?: string
}

export function PageHeader({ title, description, breadcrumbs, actions, descriptionClassName }: PageHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="page-header-panel glass-panel rounded-[1.6rem] p-6 lg:p-7 overflow-hidden"
    >
      {/* 面包屑导航 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm relative z-10">
          {breadcrumbs.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-full px-2 py-1 text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300"
                >
                  {item.title}
                </Link>
              ) : (
                <span className="rounded-full px-2 py-1 text-slate-700 dark:text-slate-200">{item.title}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* 主体：左侧内容 + 右侧动效装饰 */}
      <div className="page-header-hero-grid">
        {/* 左侧内容区 */}
        <div className="page-header-hero-copy relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="page-header-title mt-4 font-display tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                {title}
              </h1>
              {description && (
                <p className={['page-header-description mt-3 leading-7 text-slate-600 dark:text-slate-300', descriptionClassName].filter(Boolean).join(' ')}>{description}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* 右侧动效装饰区（仅宽屏展示） */}
        <div className="page-header-hero-aside" aria-hidden="true">
          <div className="page-header-hero-visual">
            {/* 轨道动效 */}
            <div className="page-header-hero-orbit">
              <span className="page-header-orbit-ring page-header-orbit-ring-lg" />
              <span className="page-header-orbit-ring page-header-orbit-ring-sm" />
              <span className="page-header-orbit-node page-header-orbit-node-a" />
              <span className="page-header-orbit-node page-header-orbit-node-b" />
              <span className="page-header-orbit-node page-header-orbit-node-c" />
            </div>
            {/* 流动轨迹线 */}
            <div className="page-header-hero-tracks">
              <span />
              <span />
              <span />
            </div>
            {/* 柱状指示条 */}
            <div className="page-header-hero-bars">
              <span />
              <span />
              <span />
              <span />
            </div>
            {/* 扫描线 */}
            <div className="page-header-hero-scanline" />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
