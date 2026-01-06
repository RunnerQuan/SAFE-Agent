'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'danger' | 'warning' | 'success'
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
}: StatCardProps) {
  const iconColors = {
    default: 'text-cyan-400 bg-cyan-400/10',
    danger: 'text-red-400 bg-red-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    success: 'text-emerald-400 bg-emerald-400/10',
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-white/40">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 text-xs',
                trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconColors[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
