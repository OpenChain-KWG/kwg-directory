'use client'

import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { ChevronDown } from 'lucide-react'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Token-driven NavigationMenu compound — wraps Radix NavigationMenu.
 *
 * Composition follows Radix conventions:
 *   <NavigationMenu>
 *     <NavigationMenuList>
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>...</NavigationMenuTrigger>
 *         <NavigationMenuContent>...</NavigationMenuContent>
 *       </NavigationMenuItem>
 *       <NavigationMenuItem>
 *         <NavigationMenuLink href="...">...</NavigationMenuLink>
 *       </NavigationMenuItem>
 *     </NavigationMenuList>
 *     <NavigationMenuViewport />
 *   </NavigationMenu>
 */
const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      'relative z-dropdown flex max-w-max flex-1 items-center justify-center',
      className,
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      'group flex flex-1 list-none items-center justify-center gap-1',
      className,
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  cn(
    'group inline-flex h-9 w-max items-center justify-center gap-1 rounded-md px-3 py-2',
    'text-sm font-medium text-[var(--color-text-default)]',
    'bg-transparent transition-colors duration-150 ease-out',
    'hover:bg-[var(--color-bg-surface-alt)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
    'data-[active]:bg-[var(--color-bg-surface-alt)]',
    'data-[state=open]:bg-[var(--color-bg-surface-alt)]',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), 'group', className)}
    {...props}
  >
    {children}
    <ChevronDown
      className="size-3 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
      aria-hidden
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full md:absolute md:w-auto',
      'data-[state=open]:animate-fade-in motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    className={cn(
      'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none',
      'text-sm text-[var(--color-text-default)]',
      'transition-colors duration-150 ease-out',
      'hover:bg-[var(--color-bg-surface-alt)] hover:text-[var(--color-text-default)]',
      'focus-visible:bg-[var(--color-bg-surface-alt)]',
      'focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
      className,
    )}
    {...props}
  />
))
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className="absolute left-0 top-full flex justify-center">
    <NavigationMenuPrimitive.Viewport
      ref={ref}
      className={cn(
        'origin-top-center relative mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md',
        'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
        'border border-[var(--color-border-subtle)] shadow-md',
        'md:w-[var(--radix-navigation-menu-viewport-width)]',
        'data-[state=open]:animate-fade-in motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      'top-full z-raised flex h-1.5 items-end justify-center overflow-hidden',
      'data-[state=visible]:animate-fade-in motion-reduce:animate-none',
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-[var(--color-border-subtle)] shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
}
