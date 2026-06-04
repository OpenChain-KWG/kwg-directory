'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog'

/**
 * CommandMenu — palette / quick-search pattern built atop `cmdk`.
 *
 * Compound API:
 *   <CommandMenu open={open} onOpenChange={setOpen}>
 *     <CommandMenuInput placeholder={t('search')} />
 *     <CommandMenuList>
 *       <CommandMenuEmpty>{t('noResults')}</CommandMenuEmpty>
 *       <CommandMenuGroup heading={t('members')}>
 *         <CommandMenuItem onSelect={...}>Alice</CommandMenuItem>
 *       </CommandMenuGroup>
 *       <CommandMenuSeparator />
 *       <CommandMenuItem>
 *         Toggle theme
 *         <CommandMenuShortcut>{'⌘T'}</CommandMenuShortcut>
 *       </CommandMenuItem>
 *     </CommandMenuList>
 *   </CommandMenu>
 *
 * Notes:
 *   - Controlled-only: caller owns `open` + `onOpenChange`. Keyboard
 *     shortcut wiring (e.g. ⌘K) is the caller's responsibility — keeps the
 *     primitive focus-mode agnostic and avoids global key listener leaks.
 *   - Mounts inside a Dialog so focus-trap, escape-to-close, and
 *     `var(--z-modal)` layering come for free. `cmdk` lives inside the
 *     modal stack — no z-index conflicts with Popover/Tooltip.
 *   - Visible labels are caller-provided to honour i18n-strings.md (no
 *     hardcoded copy inside the primitive).
 */

interface CommandMenuRootProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  /** Controlled open state. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Visually hidden title for the dialog landmark. */
  dialogTitle: string
  /** Optional description text for AT users (visually hidden). */
  dialogDescription?: string
}

const CommandMenu = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandMenuRootProps
>(
  (
    { open, onOpenChange, dialogTitle, dialogDescription, className, children, ...props },
    ref,
  ) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden p-0',
          'sm:max-w-lg',
        )}
      >
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        {dialogDescription ? (
          <p className="sr-only">{dialogDescription}</p>
        ) : null}
        <CommandPrimitive
          ref={ref}
          className={cn(
            'flex h-full w-full flex-col overflow-hidden rounded-md',
            'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
            className,
          )}
          {...props}
        >
          {children}
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  ),
)
CommandMenu.displayName = 'CommandMenu'

const CommandMenuInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      'flex items-center gap-2 px-3',
      'border-b border-[var(--color-border-subtle)]',
    )}
    cmdk-input-wrapper=""
  >
    <Search
      className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
      aria-hidden
    />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none',
        'placeholder:text-[var(--color-text-faint)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
))
CommandMenuInput.displayName = 'CommandMenuInput'

const CommandMenuList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'max-h-80 overflow-y-auto overflow-x-hidden p-1',
      className,
    )}
    {...props}
  />
))
CommandMenuList.displayName = 'CommandMenuList'

const CommandMenuEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(
      'py-6 text-center text-sm text-[var(--color-text-muted)]',
      className,
    )}
    {...props}
  />
))
CommandMenuEmpty.displayName = 'CommandMenuEmpty'

const CommandMenuGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-[var(--color-text-default)]',
      '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
      '[&_[cmdk-group-heading]]:text-[var(--color-text-muted)]',
      className,
    )}
    {...props}
  />
))
CommandMenuGroup.displayName = 'CommandMenuGroup'

const CommandMenuSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 h-px bg-[var(--color-border-subtle)]', className)}
    {...props}
  />
))
CommandMenuSeparator.displayName = 'CommandMenuSeparator'

const CommandMenuItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5',
      'text-sm outline-none',
      'transition-colors duration-150 ease-out',
      "data-[selected='true']:bg-[var(--color-bg-surface-alt)]",
      "data-[selected='true']:text-[var(--color-text-default)]",
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      '[&_svg]:size-4 [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
))
CommandMenuItem.displayName = 'CommandMenuItem'

const CommandMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'ml-auto text-xs tracking-widest text-[var(--color-text-muted)]',
      className,
    )}
    {...props}
  />
)
CommandMenuShortcut.displayName = 'CommandMenuShortcut'

export {
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuEmpty,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  CommandMenuShortcut,
}

export type { CommandMenuRootProps }
