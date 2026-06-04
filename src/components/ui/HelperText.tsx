'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type HelperTextProps = React.HTMLAttributes<HTMLParagraphElement>

/**
 * Small descriptive text typically rendered beneath a form control.
 * Token: muted text on default surface.
 */
const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-xs leading-relaxed text-[var(--color-text-muted)]',
        className,
      )}
      {...props}
    />
  ),
)
HelperText.displayName = 'HelperText'

export { HelperText }
