'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Spinner } from './Spinner'

/**
 * IconButton — square Button variant for icon-only triggers.
 *
 * Reuses Button visual variants but enforces square aspect ratios (icon-sm/md/lg)
 * and a required `aria-label` (a11y minimum: every interactive control has an
 * accessible name).
 */
const iconButtonVariants = cva(
  cn(
    'inline-flex items-center justify-center shrink-0',
    'transition-colors duration-150 ease-out',
    'rounded-md select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'bg-[var(--color-state-primary)] text-[var(--color-text-on-brand)]',
          'hover:bg-[var(--color-primary-600)]',
          'active:bg-[var(--color-primary-700)]',
        ),
        secondary: cn(
          'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-default)]',
          'border border-[var(--color-border-default)]',
          'hover:bg-[var(--color-bg-surface-muted)]',
          'active:bg-[var(--color-border-subtle)]',
        ),
        outline: cn(
          'bg-transparent text-[var(--color-text-default)]',
          'border border-[var(--color-border-default)]',
          'hover:bg-[var(--color-bg-surface-alt)]',
          'active:bg-[var(--color-bg-surface-muted)]',
        ),
        ghost: cn(
          'bg-transparent text-[var(--color-text-default)]',
          'hover:bg-[var(--color-bg-surface-alt)]',
          'active:bg-[var(--color-bg-surface-muted)]',
        ),
        destructive: cn(
          'bg-[var(--color-state-danger)] text-[var(--color-text-on-brand)]',
          'hover:bg-[var(--color-danger-600)]',
          'active:bg-[var(--color-danger-700)]',
        ),
      },
      size: {
        'icon-sm': 'h-8 w-8 [&_svg]:size-4',
        'icon-md': 'h-10 w-10 [&_svg]:size-4',
        'icon-lg': 'h-12 w-12 [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'icon-md',
    },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Required accessible name for the icon-only control. */
  'aria-label': string
  /** Render as the supplied child (Radix Slot). Useful for `<Link>` wrapping. */
  asChild?: boolean
  /** Show a Spinner inside the button and disable interactions. */
  loading?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    return (
      <Comp
        ref={ref}
        className={cn(iconButtonVariants({ variant, size }), className)}
        aria-busy={loading || undefined}
        disabled={isDisabled}
        {...props}
      >
        {loading ? <Spinner size="sm" aria-hidden /> : children}
      </Comp>
    )
  },
)
IconButton.displayName = 'IconButton'

export { IconButton, iconButtonVariants }
