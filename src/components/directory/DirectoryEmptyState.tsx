'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui'
import { EmptyState } from '@/components/patterns'
import { EmptyIllustration } from '@/components/illustrations'

export interface DirectoryEmptyStateProps {
  /** Fires when the user clicks the reset CTA. */
  onReset: () => void
  /** Override the empty state title. */
  title?: string
  /** Override the empty state description. */
  description?: string
  /** Override the reset button label. */
  resetLabel?: string
}

/**
 * DirectoryEmptyState — wraps the EmptyState pattern for directory v2 misses.
 */
export function DirectoryEmptyState({
  onReset,
  title,
  description,
  resetLabel,
}: DirectoryEmptyStateProps) {
  const t = useTranslations('directory.v2')
  return (
    <EmptyState
      data-testid="directory-v2-empty-state"
      illustration={<EmptyIllustration className="h-16 w-16 text-[var(--color-text-muted)]" />}
      title={title ?? t('emptyTitle')}
      description={description ?? t('emptyDescription')}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="directory-v2-empty-reset"
          onClick={onReset}
        >
          {resetLabel ?? t('emptyResetButton')}
        </Button>
      }
    />
  )
}
