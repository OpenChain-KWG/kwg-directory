'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Skeleton placeholder leveraging the global `.skeleton` keyframe defined in
 * globals.css for consistent pulse motion across the app.
 */
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('skeleton h-4 w-full rounded-md', className)}
      {...props}
    />
  ),
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }
