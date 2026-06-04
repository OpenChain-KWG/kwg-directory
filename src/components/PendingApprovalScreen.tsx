'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { btnPrimary, btnSecondary, btnDestructive } from '@/lib/button-styles'
import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'

interface Props {
  name: string
  createdAt: string
}

export default function PendingApprovalScreen({ name, createdAt }: Props) {
  const t = useTranslations('pendingApproval')
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const formatDate = (iso: string): string => {
    const d = new Date(iso)
    // 숫자 그룹핑(예: 2,026) 방지를 위해 문자열로 치환한다.
    return t('appliedDate', {
      year: String(d.getFullYear()),
      month: String(d.getMonth() + 1),
      day: String(d.getDate()),
    })
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/members/me', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('cancelError'))
      }
      await signOut({ callbackUrl: '/?withdrawn=1' })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('cancelError'))
      setCancelling(false)
      setShowConfirm(false)
    }
  }

  return (
    <div
      className="flex-1 flex items-center justify-center px-4 py-24"
      data-testid="pending-approval-screen"
    >
      <div className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-sm p-10 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/kwg-logo.png"
            alt={t('logoAlt')}
            width={56}
            height={56}
            style={{ width: 'auto', height: '56px' }}
          />
        </div>

        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">
          {t('greeting', { name })}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
          {t('reviewing')}<br />
          {t('reviewingLine2')}
        </p>

        <div className="text-xs text-[var(--color-text-muted)] space-y-1 mb-6">
          <p>{t('appliedAt', { date: formatDate(createdAt) })}</p>
          <p>{t('expectedProcessing')}</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4 text-left">
            {error}
          </Alert>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            href="/profile/edit"
            className={cn(
              'inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark',
              btnPrimary
            )}
          >
            {t('editProfile')}
          </Link>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className={cn(
              'inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-danger-400)] hover:text-[var(--color-state-danger)]',
              btnSecondary
            )}
          >
            {t('cancelApplication')}
          </button>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          {t('contactLabel')}{' '}
          <a
            href="mailto:korea-sg-planning@lists.openchainproject.org"
            className="text-[var(--color-primary)] hover:underline"
          >
            korea-sg-planning@lists.openchainproject.org
          </a>
        </p>
      </div>

      {/* 신청 취소 확인 다이얼로그 (Radix 기반 — focus trap·Esc·aria 자동 처리) */}
      <Dialog
        open={showConfirm}
        onOpenChange={(open) => {
          if (!cancelling) setShowConfirm(open)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('confirm.title')}</DialogTitle>
            <DialogDescription>{t('confirm.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={cancelling}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50',
                btnSecondary
              )}
            >
              {t('confirm.back')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-state-danger)] text-[var(--color-text-on-brand)] text-sm font-semibold hover:bg-[var(--color-danger-600)] disabled:opacity-60',
                btnDestructive
              )}
            >
              {cancelling ? t('cancelProcessing') : t('cancelApplication')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
