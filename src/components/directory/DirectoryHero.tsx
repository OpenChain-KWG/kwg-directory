'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { GithubMark } from '@/components/icons'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DirectoryHeroProps {
  /** Total approved members — drives the heading copy when authenticated. */
  totalCount?: number
  /** Whether the viewer is logged in (controls layout + CTAs). */
  isAuthenticated: boolean
  /** Server-action handler for GitHub OAuth (form action). Required when guest. */
  onGithubLogin?: () => void | Promise<void>
  /** Server-action handler for Google OAuth (form action). Optional. */
  onGoogleLogin?: () => void | Promise<void>
  className?: string
}

/**
 * DirectoryHero — top-of-page hero for the v2 directory.
 *
 * Authenticated viewers see a compact title + member-count badge.
 * Guests see a full-bleed hero with login CTAs and privacy link.
 *
 * Layout uses ui/Card surface tokens. No hex literals; all colors flow from
 * design-system tokens.
 */
export function DirectoryHero({
  totalCount,
  isAuthenticated,
  onGithubLogin,
  onGoogleLogin,
  className,
}: DirectoryHeroProps) {
  const t = useTranslations('directory.v2')

  if (isAuthenticated) {
    return (
      <section
        data-testid="directory-v2-hero"
        aria-labelledby="directory-v2-hero-title"
        className={cn(
          'flex flex-col gap-3 pb-6',
          'border-b border-[var(--color-border-subtle)]',
          className,
        )}
      >
        <Badge variant="secondary" className="self-start">
          {t('heroBadge')}
        </Badge>
        <div className="flex flex-col gap-2">
          <h1
            id="directory-v2-hero-title"
            data-testid="directory-v2-hero-title"
            className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-text-default)] sm:text-3xl"
          >
            {t('heroTitleAuthed')}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('heroDescriptionAuthed')}
            {typeof totalCount === 'number' && totalCount > 0 && (
              <>
                {' '}
                <span className="font-medium text-[var(--color-text-default)]">
                  {t('heroMemberCount', { count: totalCount })}
                </span>
              </>
            )}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      data-testid="directory-v2-hero"
      aria-labelledby="directory-v2-hero-title"
      className={cn('flex w-full justify-center px-2 py-12 sm:py-16', className)}
    >
      <Card className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-10 text-center sm:px-10 sm:py-14">
        <Badge variant="secondary">
          {t('heroBadge')}
        </Badge>
        <h1
          id="directory-v2-hero-title"
          data-testid="directory-v2-hero-title"
          className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text-default)] sm:text-4xl"
        >
          {t('heroTitleGuest')}
        </h1>
        <p className="max-w-xl whitespace-pre-line text-base leading-relaxed text-[var(--color-text-muted)]">
          {t('heroDescriptionGuest')}
        </p>
        {typeof totalCount === 'number' && totalCount > 0 && (
          <p className="text-sm font-medium text-[var(--color-text-default)]">
            {t('guestMemberCount', { count: totalCount })}
          </p>
        )}
        <ul className="flex w-full max-w-sm flex-col gap-2 text-left">
          {(['trustEmailPrivacy', 'trustApproval', 'trustPipa'] as const).map(
            (key) => (
              <li
                key={key}
                className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
              >
                <Check
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-state-success)]"
                />
                <span>{t(key)}</span>
              </li>
            ),
          )}
        </ul>
        <div className="flex w-full max-w-sm flex-col gap-2">
          {onGithubLogin && (
            <form action={onGithubLogin} className="w-full">
              <Button type="submit" size="lg" className="w-full">
                <GithubMark className="h-4 w-4" />
                {t('heroLoginGitHub')}
              </Button>
            </form>
          )}
          {onGoogleLogin && (
            <form action={onGoogleLogin} className="w-full">
              <Button type="submit" variant="outline" size="lg" className="w-full">
                <LogIn aria-hidden />
                {t('heroLoginGoogle')}
              </Button>
            </form>
          )}
          <Link
            href="/privacy"
            className={cn(
              'mt-1 text-sm text-[var(--color-text-muted)] underline-offset-4',
              'hover:text-[var(--color-text-default)] hover:underline',
              'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
            )}
          >
            {t('heroPrivacyLink')}
          </Link>
        </div>
      </Card>
    </section>
  )
}
