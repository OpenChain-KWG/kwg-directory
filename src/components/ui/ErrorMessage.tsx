'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type ErrorMessageProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * Inline error message — danger-toned, role="alert", aria-live="polite".
 * Use beneath a form control to communicate validation failures.
 */
const ErrorMessage = React.forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    return (
      <p
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'text-xs leading-relaxed font-medium text-[var(--color-state-danger)]',
          className,
        )}
        {...props}
      >
        {children}
      </p>
    )
  },
)
ErrorMessage.displayName = 'ErrorMessage'

export { ErrorMessage }
