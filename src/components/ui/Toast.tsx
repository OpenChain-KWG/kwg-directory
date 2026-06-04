'use client'

import * as React from 'react'
import { Toaster as SonnerToaster, toast } from 'sonner'

/**
 * Toast / Toaster — token-driven sonner wrapper.
 *
 * - `Toaster` should be mounted once at the root of an app (NOT auto-injected
 *   into layout from this design-system module). Apps opt in explicitly.
 * - Use `import { toast } from '@/components/ui/Toast'` to fire toasts:
 *     toast.success('Saved')
 *     toast.error('Network error')
 *
 * Styling is wired through CSS variables consumed by sonner's
 * `--normal-*` / `--success-*` / `--error-*` knobs. We map them onto our
 * design tokens so themes propagate automatically.
 */

export type ToasterProps = React.ComponentPropsWithoutRef<typeof SonnerToaster>

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className={className}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[var(--color-bg-surface)] group-[.toaster]:text-[var(--color-text-default)] group-[.toaster]:border group-[.toaster]:border-[var(--color-border-subtle)] group-[.toaster]:shadow-md',
          description: 'group-[.toast]:text-[var(--color-text-muted)]',
          actionButton:
            'group-[.toast]:bg-[var(--color-state-primary)] group-[.toast]:text-[var(--color-text-on-brand)]',
          cancelButton:
            'group-[.toast]:bg-[var(--color-bg-surface-muted)] group-[.toast]:text-[var(--color-text-muted)]',
          success: 'group-[.toaster]:text-[var(--color-state-success)]',
          error: 'group-[.toaster]:text-[var(--color-state-danger)]',
          warning: 'group-[.toaster]:text-[var(--color-state-warning)]',
          info: 'group-[.toaster]:text-[var(--color-state-info)]',
        },
      }}
      {...props}
    />
  )
}
Toaster.displayName = 'Toaster'

export { Toaster, toast }
