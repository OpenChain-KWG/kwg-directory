'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface FormSectionProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
  /** Section heading rendered inside <legend>. */
  title: React.ReactNode
  /** Optional descriptive copy beneath the legend. */
  description?: React.ReactNode
  /** Optional helper text rendered above the grid (general guidance). */
  helperText?: React.ReactNode
  /** Number of columns in the field grid. Defaults to 1. */
  columns?: 1 | 2
}

/**
 * FormSection — groups related form fields under a semantic <fieldset>/<legend>.
 *
 * Layout:
 *   <legend> + optional description + optional helper
 *   ↓
 *   <div role="group"> with 1- or 2-column responsive grid (children).
 *
 * Children are rendered inside the grid, so each direct child becomes a grid
 * item. Use `columns={2}` for compact field pairs (label + control already
 * stack inside FormField).
 */
const FormSection = React.forwardRef<HTMLFieldSetElement, FormSectionProps>(
  (
    {
      className,
      title,
      description,
      helperText,
      columns = 1,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <fieldset
        ref={ref}
        className={cn('flex flex-col gap-4 border-0 p-0', className)}
        {...props}
      >
        <div className="flex flex-col gap-1.5">
          <legend className="text-base font-semibold leading-tight tracking-tight text-[var(--color-text-default)]">
            {title}
          </legend>
          {description && (
            <p className="text-sm text-[var(--color-text-muted)]">
              {description}
            </p>
          )}
          {helperText && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {helperText}
            </p>
          )}
        </div>
        <div
          className={cn(
            'grid gap-4',
            columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
          )}
        >
          {children}
        </div>
      </fieldset>
    )
  },
)
FormSection.displayName = 'FormSection'

export { FormSection }
