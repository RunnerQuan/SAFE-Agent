import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-white/80",
        outline: "border border-white/20 text-white/80",
        high: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
        medium: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
        low: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
        unknown: "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20",
        queued: "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20",
        running: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
        succeeded: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
        failed: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
        canceled: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
