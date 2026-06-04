'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

const THEME_KEY = 'kwg-theme'

/**
 * ThemeToggle — flips the active theme (light ↔ dark) and persists the choice to
 * localStorage (key `kwg-theme`, read by the pre-paint script in the root
 * layout). With no stored choice, the OS `prefers-color-scheme` is the default.
 *
 * Renders a stable placeholder icon until mounted so SSR and the first client
 * render agree (no hydration mismatch).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('navbar')
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'dark' ? 'dark' : 'light')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* localStorage unavailable (private mode) — the DOM update still applies */
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      aria-label={t('themeToggle')}
      title={t('themeToggle')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md',
        'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
        className,
      )}
    >
      {mounted && theme === 'dark' ? (
        <Sun aria-hidden className="h-4 w-4" />
      ) : (
        <Moon aria-hidden className="h-4 w-4" />
      )}
    </button>
  )
}
