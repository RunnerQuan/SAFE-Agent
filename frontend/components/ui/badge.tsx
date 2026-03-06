import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-700/45 text-slate-200',
        outline: 'border border-slate-300/25 text-slate-200',
        high: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
        medium: 'bg-amber-500/16 text-amber-100 ring-1 ring-amber-400/32',
        low: 'bg-emerald-500/16 text-emerald-100 ring-1 ring-emerald-400/32',
        unknown: 'bg-slate-500/16 text-slate-200 ring-1 ring-slate-300/30',
        queued: 'bg-slate-500/16 text-slate-100 ring-1 ring-slate-300/24',
        running: 'bg-sky-500/18 text-sky-100 ring-1 ring-sky-400/30',
        succeeded: 'bg-emerald-500/16 text-emerald-100 ring-1 ring-emerald-400/32',
        failed: 'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30',
        canceled: 'bg-amber-500/16 text-amber-100 ring-1 ring-amber-400/32',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }