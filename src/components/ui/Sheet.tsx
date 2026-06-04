'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Sheet primitives — a Dialog with side-anchored content. */
const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-overlay',
      'bg-[var(--color-bg-overlay)]',
      'data-[state=open]:animate-modal-overlay-in',
      'data-[state=closed]:animate-modal-overlay-out',
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva(
  cn(
    'fixed z-modal bg-[var(--color-bg-surface)]',
    'border-[var(--color-border-subtle)] shadow-xl',
    'transition ease-out duration-300',
  ),
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=open]:animate-modal-overlay-in',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=open]:animate-modal-content-in data-[state=closed]:animate-modal-content-out',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm data-[state=open]:animate-modal-overlay-in',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm data-[state=open]:animate-modal-overlay-in',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), 'p-6 focus:outline-none', className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center',
          'rounded-md text-[var(--color-text-muted)]',
          'transition-colors duration-150 ease-out',
          'hover:bg-[var(--color-bg-surface-alt)] hover:text-[var(--color-text-default)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
        )}
      >
        <X className="h-4 w-4" aria-hidden />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 pb-4', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight text-[var(--color-text-default)]',
      className,
    )}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
