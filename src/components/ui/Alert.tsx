'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Alert — semantic, persistent notification surface.
 *
 * Variants map to status semantics (info/success/warning/danger) with token-driven
 * background, border and text colors. Renders with `role="alert"` so screen readers
 * announce the contents when mounted.
 *
 * Compose via the slot helpers (AlertTitle / AlertDescription) or pass children.
 */
const alertVariants = cva(
  cn(
    'relative w-full rounded-md border p-4',
    'text-sm leading-relaxed',
    '[&>svg+div]:pl-7',
    '[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4',
  ),
  {
    variants: {
      variant: {
        info: cn(
          'bg-[var(--color-info-50)] text-[var(--color-info-900)]',
          'border-[var(--color-info-200)]',
          '[&>svg]:text-[var(--color-info-600)]',
        ),
        success: cn(
          'bg-[var(--color-success-50)] text-[var(--color-success-900)]',
          'border-[var(--color-success-200)]',
          '[&>svg]:text-[var(--color-success-600)]',
        ),
        warning: cn(
          'bg-[var(--color-warning-50)] text-[var(--color-warning-900)]',
          'border-[var(--color-warning-200)]',
          '[&>svg]:text-[var(--color-warning-700)]',
        ),
        danger: cn(
          'bg-[var(--color-danger-50)] text-[var(--color-danger-900)]',
          'border-[var(--color-danger-200)]',
          '[&>svg]:text-[var(--color-danger-600)]',
        ),
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

const DEFAULT_ICON: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, React.ReactNode> = {
  info: <Info aria-hidden />,
  success: <CheckCircle2 aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  danger: <AlertCircle aria-hidden />,
}

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  /** Optional headline rendered with semantic emphasis. */
  title?: React.ReactNode
  /** Optional descriptive copy. */
  description?: React.ReactNode
  /** Override the default semantic icon (or pass `null` to hide). */
  icon?: React.ReactNode | null
  /** Renders a dismiss control. Provide `onDismiss` to handle the action. */
  dismissible?: boolean
  /** Callback invoked when the dismiss control is activated. */
  onDismiss?: () => void
  /** Accessible label for the dismiss control. Defaults to "Dismiss". */
  dismissLabel?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant,
      title,
      description,
      icon,
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
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {resolvedIcon}
        <div className="flex flex-col gap-1">
          {title && (
            <p className="font-semibold leading-tight tracking-tight">
              {title}
            </p>
          )}
          {description && <div className="text-sm">{description}</div>}
          {children && <div className="text-sm">{children}</div>}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={cn(
              'absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-sm',
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
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription, alertVariants }
