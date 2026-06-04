'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Optional tick marks rendered along the track.
   * Each entry must be within `min..max`.
   */
  marks?: { value: number; label?: React.ReactNode }[]
}

/**
 * Token-driven Slider primitive — wraps Radix Slider.
 *
 * Supports range (multiple thumbs), arbitrary `step`, and optional `marks`.
 * Each thumb gets focus styling; consumers should provide `aria-label` per thumb
 * (or `aria-labelledby`) for screen-reader names.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, marks, min = 0, max = 100, value, defaultValue, ...props }, ref) => {
  // Determine thumb count from value/defaultValue (default to single thumb).
  const thumbValues = (value ?? defaultValue ?? [min]) as number[]

  const range = max - min || 1
  return (
    <SliderPrimitive.Root
      ref={ref}
      min={min}
      max={max}
      value={value}
      defaultValue={defaultValue}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative h-1.5 w-full grow overflow-hidden rounded-full',
          'bg-[var(--color-bg-surface-muted)]',
        )}
      >
        <SliderPrimitive.Range
          className={cn('absolute h-full bg-[var(--color-state-primary)]')}
        />
      </SliderPrimitive.Track>
      {marks && marks.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {marks.map((mark) => {
            const pct = ((mark.value - min) / range) * 100
            return (
              <div
                key={mark.value}
                aria-hidden
                className="absolute -translate-x-1/2"
                style={{ left: `${pct}%` }}
              >
                <span className="block h-2 w-px bg-[var(--color-border-strong)]" />
                {mark.label && (
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap text-xs text-[var(--color-text-muted)]">
                    {mark.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {thumbValues.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'block h-4 w-4 rounded-full',
            'bg-[var(--color-bg-surface)] border-2 border-[var(--color-state-primary)]',
            'shadow-sm transition-colors duration-150 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
