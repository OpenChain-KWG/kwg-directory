'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  IconButton,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from '@/components/ui'

export interface NavbarMobileMenuLink {
  href: string
  labelKey: 'directoryLink' | 'aboutLink' | 'privacyLink' | 'registerProfile' | 'editProfile' | 'adminLink'
  testId?: string
  external?: boolean
}

export interface NavbarMobileMenuProps {
  /** Links rendered in the slide-out drawer. Authenticated state is computed server-side. */
  links: NavbarMobileMenuLink[]
}

/**
 * Mobile-only slide-in navigation. Server-rendered Navbar passes pre-computed
 * links; this client component handles the disclosure state.
 */
export function NavbarMobileMenu({ links }: NavbarMobileMenuProps) {
  const t = useTranslations('navbar')
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton
          aria-label={t('openMenu')}
          data-testid="navbar-mobile-menu-btn"
          size="icon-md"
          variant="ghost"
          className="md:hidden"
        >
          <Menu aria-hidden />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="left" data-testid="navbar-mobile-menu">
        <SheetHeader>
          <SheetTitle>{t('mobileNavTitle')}</SheetTitle>
          <SheetDescription>{t('mobileNavDescription')}</SheetDescription>
        </SheetHeader>
        <Separator className="my-2" />
        <nav aria-label={t('mobileNavTitle')}>
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <SheetClose asChild>
                  <Link
                    href={link.href}
                    data-testid={link.testId}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-default)] transition-colors hover:bg-[var(--color-bg-surface-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  >
                    {t(link.labelKey)}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
