'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { logger } from '@/lib/logger'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PrivacyError({ error, reset }: ErrorProps) {
  const t = useTranslations('errorPage')

  useEffect(() => {
    logger.error(
      { event: 'app_error', route: 'privacy', digest: error.digest },
      'privacy route error',
    )
  }, [error])

  return (
    <div
      role="alert"
      data-testid="error-privacy"
      className="flex flex-col items-center justify-center gap-4 py-24 px-4 text-center"
    >
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-md">{t('description')}</p>
      {error.digest && (
        <p className="text-xs text-[var(--color-text-muted)] font-mono">
          {t('errorCode', { digest: error.digest })}
        </p>
      )}
      <div className="flex items-center gap-3 mt-2">
        <Button type="button" onClick={reset} variant="primary" data-testid="error-retry-btn">
          {t('retry')}
        </Button>
        <Button asChild variant="ghost" data-testid="error-back-home-btn">
          <Link href="/">{t('backHome')}</Link>
        </Button>
      </div>
    </div>
  )
}
