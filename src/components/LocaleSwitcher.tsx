'use client'

import * as React from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'

import { cn } from '@/lib/utils'
import { type Locale } from '@/i18n/routing'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * LocaleSwitcher — toggles the UI language by writing the `NEXT_LOCALE` cookie
 * (read by `src/i18n/request.ts`) and refreshing the server components.
 *
 * Cookie-based rather than URL-based: the directory is noindex/login-gated, so a
 * `[locale]` route segment would add complexity without SEO benefit.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = useTranslations('navbar')
  const names = useTranslations('navbar.languageNames')
  const [pending, startTransition] = React.useTransition()

  const next: Locale = locale === 'ko' ? 'en' : 'ko'

  function switchTo(target: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(next)}
      disabled={pending}
      data-testid="locale-switcher"
      aria-label={`${t('language')} (${names(next)})`}
      title={t('language')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
        'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
        'transition-colors disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
        className,
      )}
    >
      <Languages aria-hidden className="h-4 w-4" />
      <span>{names(locale)}</span>
    </button>
  )
}
