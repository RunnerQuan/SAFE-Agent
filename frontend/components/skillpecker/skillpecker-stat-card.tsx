import { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkillPeckerStatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  accent?: 'scan' | 'issue' | 'overreach' | 'default'
  className?: string
  centered?: boolean
}

export function SkillPeckerStatCard({
  label,
  value,
  hint,
  icon,
  accent = 'default',
  className,
  centered = false,
}: SkillPeckerStatCardProps) {
  return (
    <Card className={cn('rounded-[1.8rem]', accent !== 'default' && `skillpecker-stat-card-${accent}`, className)}>
      <div className={cn('flex items-start justify-between gap-4 p-6', centered && 'items-center justify-center text-center')}>
        <div className={cn(centered && 'w-full')}>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-3 font-display text-4xl text-slate-950 dark:text-slate-50 sm:text-5xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        {icon && !centered ? (
          <div className="rounded-2xl border border-white/70 bg-white/76 p-3 dark:border-slate-700/60 dark:bg-slate-950/56">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
