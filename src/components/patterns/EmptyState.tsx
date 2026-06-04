'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Optional illustration node (icon, SVG, or custom React node).
   * Falls back to a token-driven placeholder square.
   */
  illustration?: React.ReactNode
  /** Headline of the empty state. */
  title: React.ReactNode
  /** Optional descriptive copy. */
  description?: React.ReactNode
  /** Optional call-to-action region (typically a Button or Button group). */
  action?: React.ReactNode
}

/**
 * EmptyState — pattern for blank views (empty list, no results, error retry).
 *
 * Layout: centered illustration + title + description + action stack.
 * The illustration slot accepts any node; default placeholder uses the
 * `bg-surface-muted` token so it stays themeable.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, illustration, title, description, action, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-4 py-12 text-center',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            'bg-[var(--color-bg-surface-muted)] text-[var(--color-text-muted)]',
          )}
          aria-hidden="true"
        >
          {illustration ?? (
            <span className="block h-8 w-8 rounded-md bg-[var(--color-bg-surface-alt)]" />
          )}
        </div>
        <div className="flex max-w-md flex-col gap-1.5">
          <p className="text-base font-semibold text-[var(--color-text-default)]">
            {title}
          </p>
          {description && (
            <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
        {action && <div className="mt-2 flex items-center gap-2">{action}</div>}
      </div>
    )
  },
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
