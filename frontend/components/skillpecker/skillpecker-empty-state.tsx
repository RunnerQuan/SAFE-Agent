import { LucideIcon } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { Card } from '@/components/ui/card'

interface SkillPeckerEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function SkillPeckerEmptyState(props: SkillPeckerEmptyStateProps) {
  return (
    <Card className="rounded-[1.8rem]">
      <EmptyState {...props} className="py-14" />
    </Card>
  )
}
