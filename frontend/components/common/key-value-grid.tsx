'use client'

import { cn } from '@/lib/utils'

interface KeyValueItem {
  label: string
  value: React.ReactNode
}

interface KeyValueGridProps {
  items: KeyValueItem[]
  columns?: 1 | 2 | 3
  className?: string
}

export function KeyValueGrid({
  items,
  columns = 2,
  className,
}: KeyValueGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          <dt className="text-sm text-white/40">{item.label}</dt>
          <dd className="text-sm text-white/80">{item.value}</dd>
        </div>
      ))}
    </div>
  )
}
