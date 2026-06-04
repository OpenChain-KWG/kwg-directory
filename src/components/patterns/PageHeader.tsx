'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: React.ReactNode
  href?: string
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Page title. Renders as <h1>. */
  title: React.ReactNode
  /** Optional descriptive copy beneath the title. */
  description?: React.ReactNode
  /** Optional breadcrumb trail above the title. */
  breadcrumbs?: BreadcrumbItem[]
  /** Optional right-aligned actions (button group). */
  actions?: React.ReactNode
  /** Optional tab navigation rendered below the header. */
  tabs?: React.ReactNode
}

/**
 * PageHeader — composite header for content pages.
 *
 * Layout (top to bottom):
 *   - Breadcrumbs (optional)
 *   - Title row (title/description left, actions right)
 *   - Tabs (optional)
 */
const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    { className, title, description, breadcrumbs, actions, tabs, ...props },
    ref,
  ) => {
    return (
      <header
        ref={ref}
        className={cn('flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-4', className)}
        {...props}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              {breadcrumbs.map((item, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <li key={idx} className="flex items-center gap-1.5">
                    {item.href && !isLast ? (
                      <a
                        href={item.href}
                        className="rounded-sm transition-colors hover:text-[var(--color-text-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span
                        className={cn(
                          isLast && 'text-[var(--color-text-default)]',
                        )}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                    {!isLast && (
                      <ChevronRight
                        className="h-3.5 w-3.5 text-[var(--color-text-faint)]"
                        aria-hidden
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-text-default)]">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        {tabs && <div>{tabs}</div>}
      </header>
    )
  },
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }
