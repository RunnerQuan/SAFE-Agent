import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/60 bg-white/52 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/52 dark:text-slate-200',
        outline: 'border-white/70 bg-white/42 text-slate-700 dark:border-slate-700/60 dark:bg-slate-950/34 dark:text-slate-200',
        high: 'border-rose-300/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        medium: 'border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        low: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        unknown: 'border-slate-300/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
        queued: 'border-slate-300/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
        running: 'border-sky-300/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
        succeeded: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        failed: 'border-rose-300/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        canceled: 'border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        partial: 'border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
