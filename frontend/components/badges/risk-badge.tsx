'use client'

import { Badge } from '@/components/ui/badge'
import { RiskLevel } from '@/lib/types'
import { riskLevelLabels } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'

interface RiskBadgeProps {
  risk: RiskLevel
  className?: string
  showIcon?: boolean
}

const riskIcons = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: CheckCircle,
  unknown: HelpCircle,
}

export function RiskBadge({ risk, className, showIcon = true }: RiskBadgeProps) {
  const Icon = riskIcons[risk]

  return (
    <Badge
      variant={risk}
      className={cn('flex items-center gap-1.5', className)}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {riskLevelLabels[risk] || risk}
    </Badge>
  )
}
