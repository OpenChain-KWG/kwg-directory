'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Radio group root — wraps Radix RadioGroup. */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
))
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

/** Single radio option used inside a RadioGroup. */
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'aspect-square h-4 w-4 shrink-0 rounded-full',
      'border border-[var(--color-border-default)]',
      'bg-[var(--color-bg-surface)] text-[var(--color-state-primary)]',
      'transition-colors duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-[var(--color-state-primary)]',
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <Circle
        className="h-2 w-2 fill-[var(--color-state-primary)] text-[var(--color-state-primary)]"
        aria-hidden
      />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
