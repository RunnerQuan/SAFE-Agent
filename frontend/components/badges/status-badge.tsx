'use client'

import { Badge } from '@/components/ui/badge'
import { ScanStatus } from '@/lib/types'
import { statusLabels } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface StatusBadgeProps {
  status: ScanStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={status}
      className={cn('flex items-center gap-1.5', className)}
    >
      {status === 'running' && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {statusLabels[status] || status}
    </Badge>
  )
}
