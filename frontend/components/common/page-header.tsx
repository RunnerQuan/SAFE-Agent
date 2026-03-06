'use client'

import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

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

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  gradient = false,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-8"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={`${item.title}-${index}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="flex items-center gap-1"
            >
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-500" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-md px-1 py-0.5 text-slate-400 transition-colors hover:text-sky-300"
                >
                  {item.title}
                </Link>
              ) : (
                <span className="rounded-md px-1 py-0.5 text-slate-200">{item.title}</span>
              )}
            </motion.div>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {gradient && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/25 bg-gradient-to-br from-sky-500/18 to-emerald-500/14">
                <Sparkles className="h-5 w-5 text-sky-300" />
              </div>
            )}
            <h1 className={`font-display text-3xl font-semibold ${gradient ? 'gradient-text' : 'text-slate-100'}`}>
              {title}
            </h1>
          </div>
          {description && <p className="mt-2 max-w-3xl text-sm text-slate-300/75">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="mt-6 h-px bg-gradient-to-r from-sky-300/45 via-emerald-300/35 to-transparent" />
    </motion.div>
  )
}