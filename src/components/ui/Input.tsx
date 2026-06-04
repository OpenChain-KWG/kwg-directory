'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Render the input in an error state and surface the error to AT. */
  error?: boolean
}

/** Token-driven text input with focus ring + error state. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        className={cn(
          'flex h-10 w-full min-w-0 rounded-md px-3 py-2 text-sm',
          'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
          'border border-[var(--color-border-default)]',
          'placeholder:text-[var(--color-text-faint)]',
          'transition-colors duration-150 ease-out',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
          'focus-visible:border-[var(--color-border-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error &&
            'border-[var(--color-state-danger)] focus-visible:border-[var(--color-state-danger)] focus-visible:ring-[var(--color-danger-200)]',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
