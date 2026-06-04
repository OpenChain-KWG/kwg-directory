'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Member } from '@/types/member'

type FailedInvite = Pick<Member, 'id' | 'name_ko' | 'company' | 'contact_email' | 'email' | 'mailing_invite_error'>

interface Props {
  initialFailed: FailedInvite[]
}

export default function MailingListStatus({ initialFailed }: Props) {
  const t = useTranslations('admin.mailing')
  const [failed, setFailed] = useState(initialFailed)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set())

  if (failed.length === 0) return null

  const handleReinvite = async (member: FailedInvite) => {
    setSendingId(member.id)
    try {
      const res = await fetch('/api/admin/reinvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('reinviteError'))
      }
      setSuccessIds((prev) => new Set([...prev, member.id]))
      setTimeout(() => {
        setFailed((prev) => prev.filter((m) => m.id !== member.id))
      }, 2000)
    } catch (e) {
      alert(e instanceof Error ? e.message : t('reinviteError'))
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div
      className="mt-8 border border-[var(--color-warning-200)] rounded-xl overflow-hidden"
      data-testid="mailing-list-status"
    >
      <div className="bg-[var(--color-warning-50)] px-4 py-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-[var(--color-warning-500)] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-sm font-medium text-[var(--color-warning-700)]">
          {t('failedTitle', { count: failed.length })}
        </p>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {failed.map((member) => {
          const isSuccess = successIds.has(member.id)
          const isSending = sendingId === member.id
          const displayEmail = member.contact_email || member.email || t('noEmail')

          return (
            <div
              key={member.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-[var(--color-card)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {member.name_ko}
                  <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">{member.company}</span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{displayEmail}</p>
                {member.mailing_invite_error && (
                  <p className="text-xs text-[var(--color-warning-600)] mt-0.5 truncate" title={member.mailing_invite_error}>
                    {t('errorLabel', {
                      message: `${member.mailing_invite_error.slice(0, 80)}${member.mailing_invite_error.length > 80 ? '…' : ''}`,
                    })}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {isSuccess ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success-600)] font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {t('sent')}
                  </span>
                ) : (
                  <button
                    onClick={() => handleReinvite(member)}
                    disabled={isSending || sendingId !== null}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-warning-500)] text-[var(--color-text-on-brand)] text-xs font-semibold hover:bg-[var(--color-warning-600)] disabled:opacity-50 transition-colors"
                  >
                    {isSending ? t('reinviting') : t('reinvite')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
