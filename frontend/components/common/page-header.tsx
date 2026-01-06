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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-1"
            >
              {index > 0 && <ChevronRight className="h-4 w-4 text-white/30" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-white/40 hover:text-cyan-400 transition-colors"
                >
                  {item.title}
                </Link>
              ) : (
                <span className="text-white/60 font-medium">{item.title}</span>
              )}
            </motion.div>
          ))}
        </nav>
      )}

      {/* Title and actions */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            {gradient && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            )}
            <h1 className={`font-display text-3xl font-bold ${gradient ? 'gradient-text' : 'text-white'}`}>
              {title}
            </h1>
          </motion.div>
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm text-white/50"
            >
              {description}
            </motion.p>
          )}
        </div>
        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            {actions}
          </motion.div>
        )}
      </div>

      {/* Decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-6 h-px bg-gradient-to-r from-cyan-500/50 via-purple-500/30 to-transparent"
        style={{ originX: 0 }}
      />
    </motion.div>
  )
}
