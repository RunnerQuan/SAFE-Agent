import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-500/10 text-slate-700',
        outline: 'border border-slate-300/55 text-slate-700 bg-white/40',
        high: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-400/35',
        medium: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-400/35',
        low: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-400/35',
        unknown: 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-400/35',
        queued: 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-400/35',
        running: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-400/35',
        succeeded: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-400/35',
        failed: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-400/35',
        canceled: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-400/35',
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

