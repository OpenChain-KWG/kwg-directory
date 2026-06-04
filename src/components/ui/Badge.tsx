'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Variant styles for the Badge primitive. */
const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
    'text-xs font-medium leading-none',
    'transition-colors duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-[var(--color-state-primary)] text-[var(--color-text-on-brand)]',
        ),
        secondary: cn(
          'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-default)]',
          'border border-[var(--color-border-subtle)]',
        ),
        success: cn(
          'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
          'border border-[var(--color-success-200)]',
        ),
        warning: cn(
          'bg-[var(--color-warning-100)] text-[var(--color-warning-700)]',
          'border border-[var(--color-warning-200)]',
        ),
        danger: cn(
          'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
          'border border-[var(--color-danger-200)]',
        ),
        info: cn(
          'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
          'border border-[var(--color-info-200)]',
        ),
        outline: cn(
          'bg-transparent text-[var(--color-text-default)]',
          'border border-[var(--color-border-default)]',
        ),
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
