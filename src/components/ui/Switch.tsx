'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

/** Token-driven Switch primitive (toggle). */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent',
      'transition-colors duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-[var(--color-state-primary)]',
      'data-[state=unchecked]:bg-[var(--color-bg-surface-muted)]',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full',
        'bg-[var(--color-bg-surface)] shadow-sm ring-0',
        'transition-transform duration-150 ease-out',
        'data-[state=checked]:translate-x-5',
        'data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
