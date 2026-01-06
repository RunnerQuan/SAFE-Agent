'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'detail'
  count?: number
  className?: string
}

export function LoadingSkeleton({
  type = 'card',
  count = 3,
  className,
}: LoadingSkeletonProps) {
  if (type === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
