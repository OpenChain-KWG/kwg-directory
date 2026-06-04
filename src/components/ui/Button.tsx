'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Spinner } from './Spinner'

/** Variant + size styles for the Button primitive (token-driven). */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
    'transition-colors duration-150 ease-out',
    'rounded-md select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
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
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the supplied child (Radix Slot). Useful for `<Link>` wrapping. */
  asChild?: boolean
  /** Show a Spinner inside the button and disable interactions. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
        className={cn(buttonVariants({ variant, size }), className)}
        aria-busy={loading || undefined}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" aria-hidden />
            <span className="sr-only">Loading</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
