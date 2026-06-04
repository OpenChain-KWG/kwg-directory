'use client'

import * as React from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import type { Member } from '@/types/member'

import { MemberCardV2 } from './MemberCardV2'

export interface DirectoryVirtualGridProps {
  /** Sorted, filtered members visible in the directory. */
  members: readonly Member[]
  /** Optional class on the outer wrapper. */
  className?: string
  /** Estimated row height — TanStack uses this until cells measure. */
  estimateRowHeightPx?: number
  /** Vertical gap between rows in px. */
  rowGapPx?: number
  /** Override the column count breakpoints. Defaults to 2 / 3 / 4 (mobile / tablet / desktop). */
  breakpoints?: { mobile: number; tablet: number; desktop: number }
}

/**
 * DirectoryVirtualGrid — windowed grid for large directories.
 *
 * Strategy:
 *   - Compute column count from a ResizeObserver on the wrapper so the grid
 *     stays in sync with our 2/3/4 column breakpoints (sm/lg).
 *   - Virtualize *rows*, keeping each row a flex/grid lane of `cols` cards.
 *     Cell heights vary per locale, so `useWindowVirtualizer` measures them
 *     and re-flows on resize. window scroll keeps the page-level a11y intact.
 *   - The outer `<ul role="list">` mirrors DirectoryGrid's semantics so the
 *     orchestrator and screen-readers see the same structure either way.
 *
 * Switch in the orchestrator when `members.length` crosses the threshold
 * (default 100 — see `DirectoryV2Page`). For lists below the threshold the
 * non-virtual `DirectoryGrid` keeps perfect SEO-friendly DOM shape.
 */
export function DirectoryVirtualGrid({
  members,
  className,
  estimateRowHeightPx = 220,
  rowGapPx = 16,
  breakpoints = { mobile: 2, tablet: 3, desktop: 4 },
}: DirectoryVirtualGridProps) {
  const t = useTranslations('directory.v2')
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const [cols, setCols] = React.useState<number>(breakpoints.desktop)
  // Wrapper's document offset, measured in an effect (not during render) so the
  // window virtualizer positions rows relative to it without violating React's
  // "no ref access during render" rule.
  const [scrollMargin, setScrollMargin] = React.useState(0)

  // Track wrapper width to derive column count without inline px values in CSS.
  React.useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const update = () => {
      const w = node.clientWidth
      if (w >= 1024) setCols(breakpoints.desktop)
      else if (w >= 640) setCols(breakpoints.tablet)
      else setCols(breakpoints.mobile)
      setScrollMargin(node.offsetTop)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [breakpoints])

  const rowCount = Math.ceil(members.length / Math.max(1, cols))

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeightPx + rowGapPx,
    overscan: 4,
    scrollMargin,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  return (
    <div
      ref={wrapperRef}
      data-testid="directory-v2-virtual-grid"
      className={cn('relative w-full', className)}
    >
      <ul
        role="list"
        aria-label={t('gridAriaLabel')}
        className="relative block"
        style={{ height: totalSize }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * cols
          const rowMembers = members.slice(startIndex, startIndex + cols)
          const colsClass =
            cols === 4
              ? 'grid-cols-4'
              : cols === 3
                ? 'grid-cols-3'
                : 'grid-cols-2'
          return (
            <li
              key={virtualRow.key}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              data-testid="directory-v2-virtual-row"
              className={cn('absolute left-0 top-0 w-full grid gap-3 sm:gap-4', colsClass)}
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                paddingBottom: rowGapPx,
              }}
            >
              {rowMembers.map((member) => (
                <div
                  key={member.id}
                  data-testid="directory-v2-virtual-cell"
                >
                  <MemberCardV2 member={member} />
                </div>
              ))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
