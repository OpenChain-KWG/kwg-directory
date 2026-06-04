'use client'

import * as React from 'react'

import { Card, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

import { DirectoryGrid } from './DirectoryGrid'

export interface DirectoryGridSkeletonProps {
  /** Override the number of skeleton cards rendered. Defaults to 8. */
  count?: number
  className?: string
}

/**
 * DirectoryGridSkeleton — 8 placeholder cards mirroring MemberCardV2 layout.
 *
 * Decorative only (`aria-hidden`). The aria-busy live region lives on the
 * orchestrator so the skeleton itself does not announce.
 */
export function DirectoryGridSkeleton({
  count = 8,
  className,
}: DirectoryGridSkeletonProps) {
  const items = React.useMemo(() => Array.from({ length: count }), [count])
  return (
    <div
      data-testid="directory-v2-skeleton"
      aria-hidden="true"
      className={cn(className)}
    >
      <DirectoryGrid>
        {items.map((_, idx) => (
          <Card
            key={idx}
            className="flex h-full flex-col gap-3 p-4 border-[var(--color-border-subtle)]"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </Card>
        ))}
      </DirectoryGrid>
    </div>
  )
}
