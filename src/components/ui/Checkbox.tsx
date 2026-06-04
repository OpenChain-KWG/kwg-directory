'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Token-driven Checkbox primitive.
 *
 * Supports tri-state via `checked="indeterminate"` (Radix passes through).
 * Wraps `@radix-ui/react-checkbox`; consumes focus-ring + state tokens.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-4 w-4 shrink-0 items-center justify-center',
      'rounded-sm border border-[var(--color-border-default)]',
      'bg-[var(--color-bg-surface)]',
      'transition-colors duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-[var(--color-state-primary)] data-[state=checked]:border-[var(--color-state-primary)] data-[state=checked]:text-[var(--color-text-on-brand)]',
      'data-[state=indeterminate]:bg-[var(--color-state-primary)] data-[state=indeterminate]:border-[var(--color-state-primary)] data-[state=indeterminate]:text-[var(--color-text-on-brand)]',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      {props.checked === 'indeterminate' ? (
        <Minus className="h-3 w-3" aria-hidden />
      ) : (
        <Check className="h-3 w-3" aria-hidden />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
