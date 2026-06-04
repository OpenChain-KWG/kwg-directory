'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'

import { cn } from '@/lib/utils'

import { IconButton } from '../ui/IconButton'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '../ui/Sheet'

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sidebar content rendered on the left (collapses into a Sheet on mobile). */
  sidebar: React.ReactNode
  /** Topbar content rendered above the main column. */
  topbar?: React.ReactNode
  /** Main column content. */
  children: React.ReactNode
  /** Width of the desktop sidebar (Tailwind w-* class). Defaults to `w-64`. */
  sidebarWidthClass?: string
  /**
   * Accessible name announced when the mobile sidebar opens.
   * Required for screen-reader users.
   */
  sidebarLabel?: string
  /** Accessible label for the mobile sidebar toggle. */
  toggleLabel?: string
}

/**
 * PageShell — application chrome layout (sidebar + topbar + main).
 *
 * - Desktop (`lg:`): persistent sidebar on the left, content fills remaining width.
 * - Mobile/tablet: sidebar collapses behind a Sheet toggled from the topbar.
 *
 * Composition is content-agnostic: callers pass any markup into `sidebar`,
 * `topbar`, and `children` slots.
 */
const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  (
    {
      className,
      sidebar,
      topbar,
      children,
      sidebarWidthClass = 'w-64',
      sidebarLabel = 'Navigation',
      toggleLabel = 'Open navigation',
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex min-h-svh w-full bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
          className,
        )}
        {...props}
      >
        {/* Desktop sidebar */}
        <aside
          aria-label={sidebarLabel}
          className={cn(
            'hidden shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] lg:block',
            sidebarWidthClass,
          )}
        >
          <div className="sticky top-0 h-svh overflow-y-auto p-4">{sidebar}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className={cn(
              'sticky top-0 z-sticky flex h-14 items-center gap-3 border-b border-[var(--color-border-subtle)]',
              'bg-[var(--color-bg-surface)] px-4',
            )}
          >
            <Sheet>
              <SheetTrigger asChild>
                <IconButton
                  aria-label={toggleLabel}
                  variant="ghost"
                  size="icon-md"
                  className="lg:hidden"
                >
                  <Menu aria-hidden />
                </IconButton>
              </SheetTrigger>
              <SheetContent side="left" className="p-4">
                <SheetTitle className="sr-only">{sidebarLabel}</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {topbar}
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 lg:px-6">{children}</main>
        </div>
      </div>
    )
  },
)
PageShell.displayName = 'PageShell'

export { PageShell }
