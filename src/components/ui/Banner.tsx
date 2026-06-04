'use client'

import * as React from 'react'
import { Megaphone, Info, AlertTriangle, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Banner — full-width, page-level notification (announcements, status, warnings).
 *
 * Distinct from Alert: Banner is intended for top-of-page placement, supports
 * `sticky` positioning, and uses brand-leaning visual weights. Renders with
 * `role="region"` plus an `aria-label` so assistive tech can navigate to it.
 */
const bannerVariants = cva(
  cn(
    'flex w-full items-start gap-3 px-4 py-3 sm:items-center',
    'text-sm leading-relaxed',
    'border-b',
  ),
  {
    variants: {
      variant: {
        info: cn(
          'bg-[var(--color-info-50)] text-[var(--color-info-900)]',
          'border-[var(--color-info-200)]',
          '[&>svg]:text-[var(--color-info-600)]',
        ),
        warning: cn(
          'bg-[var(--color-warning-50)] text-[var(--color-warning-900)]',
          'border-[var(--color-warning-200)]',
          '[&>svg]:text-[var(--color-warning-700)]',
        ),
        announcement: cn(
          'bg-[var(--color-primary-50)] text-[var(--color-primary-900)]',
          'border-[var(--color-primary-200)]',
          '[&>svg]:text-[var(--color-primary-600)]',
        ),
      },
      sticky: {
        true: 'sticky top-0 z-sticky',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'info',
      sticky: false,
    },
  },
)

const DEFAULT_ICON: Record<NonNullable<VariantProps<typeof bannerVariants>['variant']>, React.ReactNode> = {
  info: <Info aria-hidden className="size-4 shrink-0" />,
  warning: <AlertTriangle aria-hidden className="size-4 shrink-0" />,
  announcement: <Megaphone aria-hidden className="size-4 shrink-0" />,
}

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof bannerVariants> {
  /** Required accessible label for the banner region. */
  'aria-label': string
  /** Override the default icon (or pass `null` to hide). */
  icon?: React.ReactNode | null
  /** Optional right-aligned action (link or button). */
  action?: React.ReactNode
  /** Renders a dismiss control. Provide `onDismiss` to handle the action. */
  dismissible?: boolean
  /** Callback invoked when the dismiss control is activated. */
  onDismiss?: () => void
  /** Accessible label for the dismiss control. Defaults to "Dismiss". */
  dismissLabel?: string
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      variant,
      sticky,
      icon,
      action,
      dismissible = false,
      onDismiss,
      dismissLabel = 'Dismiss',
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedIcon =
      icon === null ? null : (icon ?? DEFAULT_ICON[variant ?? 'info'])

    return (
      <div
        ref={ref}
        role="region"
        className={cn(bannerVariants({ variant, sticky }), className)}
        {...props}
      >
        {resolvedIcon}
        <div className="flex-1">{children}</div>
        {action && <div className="shrink-0">{action}</div>}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
              'text-current opacity-70 transition-opacity duration-150 ease-out',
              'hover:opacity-100 focus-visible:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
            )}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    )
  },
)
Banner.displayName = 'Banner'

export { Banner, bannerVariants }
