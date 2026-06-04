'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Token-driven Accordion compound — wraps Radix Accordion. */
const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[var(--color-border-subtle)]', className)}
    {...props}
  />
))
AccordionItem.displayName = AccordionPrimitive.Item.displayName

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between gap-3 py-3 text-left',
        'text-sm font-medium text-[var(--color-text-default)]',
        'transition-all duration-150 ease-out',
        'hover:text-[var(--color-text-link)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)] rounded-sm',
        'disabled:pointer-events-none disabled:opacity-50',
        '[&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className="size-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ease-out motion-reduce:transition-none"
        aria-hidden
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm text-[var(--color-text-muted)]',
      'data-[state=closed]:animate-modal-overlay-out data-[state=open]:animate-fade-in motion-reduce:animate-none',
      className,
    )}
    {...props}
  >
    <div className="pb-3 pt-0">{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
