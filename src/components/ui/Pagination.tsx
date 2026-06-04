'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

import { buttonVariants } from './Button'

/**
 * Pagination compound — token-driven, controlled.
 *
 * Composition:
 *   <Pagination>
 *     <PaginationContent>
 *       <PaginationItem><PaginationPrevious /></PaginationItem>
 *       <PaginationItem><PaginationLink isActive>1</PaginationLink></PaginationItem>
 *       <PaginationItem><PaginationEllipsis /></PaginationItem>
 *       <PaginationItem><PaginationNext /></PaginationItem>
 *     </PaginationContent>
 *   </Pagination>
 *
 * Caller is responsible for wiring `onPageChange` to consumer state. The
 * primitive ships with no internal state — keeping it composable for both
 * DataTable (programmatic) and standalone page footers.
 *
 * Required a11y attributes are baked in: `nav[aria-label]`, `aria-current`
 * on the active page link.
 */
export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible label for the navigation landmark. Required by a11y rules. */
  'aria-label': string
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      role="navigation"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  ),
)
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
))
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
))
PaginationItem.displayName = 'PaginationItem'

export interface PaginationLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Marks the item as the current page; sets `aria-current="page"`. */
  isActive?: boolean
  /** Visual size — defaults to icon-md to align with IconButton in DataTable. */
  size?: 'sm' | 'md' | 'lg'
}

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive = false, size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        'min-w-9',
        isActive && 'border-[var(--color-border-focus)] font-semibold',
        className,
      )}
      {...props}
    />
  ),
)
PaginationLink.displayName = 'PaginationLink'

export interface PaginationDirectionalProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visible label rendered next to the chevron (caller passes i18n string). */
  label?: React.ReactNode
}

const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  PaginationDirectionalProps
>(({ className, label, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      buttonVariants({ variant: 'ghost', size: 'md' }),
      'gap-1 pl-2.5',
      className,
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" aria-hidden />
    {label ? <span>{label}</span> : null}
  </button>
))
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  PaginationDirectionalProps
>(({ className, label, type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      buttonVariants({ variant: 'ghost', size: 'md' }),
      'gap-1 pr-2.5',
      className,
    )}
    {...props}
  >
    {label ? <span>{label}</span> : null}
    <ChevronRight className="h-4 w-4" aria-hidden />
  </button>
))
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    className={cn(
      'flex h-9 w-9 items-center justify-center text-[var(--color-text-muted)]',
      className,
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
