'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface DirectoryGridProps {
  children: React.ReactNode
  className?: string
}

/**
 * DirectoryGrid — responsive grid container for directory cards.
 *
 * Mobile 2 columns / tablet 3 / desktop 4. Spacing flows from the Tailwind
 * theme scale; no arbitrary values. The grid is wrapped in `@container` so
 * future embedded views (e.g. side-panel previews in chunk 2) can opt into
 * container-query breakpoints once size tokens land.
 */
export function DirectoryGrid({ children, className }: DirectoryGridProps) {
  return (
    <div
      data-testid="directory-v2-grid"
      role="list"
      className={cn(
        '@container',
        'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4',
        className,
      )}
    >
      {React.Children.map(children, (child, idx) =>
        child == null ? null : (
          <div
            role="listitem"
            key={idx}
            className="directory-card-enter"
            style={{ '--card-index': idx } as React.CSSProperties}
          >
            {child}
          </div>
        ),
      )}
    </div>
  )
}
