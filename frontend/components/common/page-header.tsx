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
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="glass-panel rounded-[1.6rem] p-6 lg:p-7"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.section>
  )
}
