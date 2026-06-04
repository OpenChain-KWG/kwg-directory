'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Member } from '@/types/member'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { btnPrimary, btnDestructive } from '@/lib/button-styles'

export type AdminInfo = {
  user_id: string
  added_at: string
  name_ko: string | null
  avatar_url: string | null
}

interface Props {
  initialAdmins: AdminInfo[]
  approvedMembers: Pick<Member, 'user_id' | 'name_ko' | 'company' | 'avatar_url'>[]
  currentUserId: string
}

export default function AdminManagement({ initialAdmins, approvedMembers, currentUserId }: Props) {
  const t = useTranslations('admin.management')
  const locale = useLocale()
  const [admins, setAdmins] = useState(initialAdmins)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  const adminUserIds = new Set(admins.map((a) => a.user_id))
  const candidates = approvedMembers.filter((m) => !adminUserIds.has(m.user_id))

  const handleRemove = async (userId: string) => {
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', user_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? t('removeError'))
        return
      }
      setAdmins((prev) => prev.filter((a) => a.user_id !== userId))
    } catch {
      alert(t('removeError'))
    } finally {
      setLoading(null)
    }
  }

  const handleAdd = async () => {
    if (!selectedUserId) return
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', user_id: selectedUserId }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? t('addError'))
        return
      }
      const member = approvedMembers.find((m) => m.user_id === selectedUserId)
      setAdmins((prev) => [
        ...prev,
        {
          user_id: selectedUserId,
          added_at: new Date().toISOString(),
          name_ko: member?.name_ko ?? null,
          avatar_url: member?.avatar_url ?? null,
        },
      ])
      setSelectedUserId('')
    } catch {
      alert(t('addError'))
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-management">
      {/* 어드민 추가 */}
      {candidates.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">{t('addTitle')}</h2>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              aria-label={t('addTitle')}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">{t('addSelectPlaceholder')}</option>
              {candidates.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name_ko} ({m.company})
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedUserId || addLoading}
              className={cn(
                'px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 whitespace-nowrap',
                btnPrimary
              )}
            >
              {addLoading ? t('adding') : t('addButton')}
            </button>
          </div>
        </div>
      )}

      {/* 어드민 목록 */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">
          {t('currentTitle', { count: admins.length })}
        </h2>
        {admins.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)]">{t('empty')}</p>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => {
              const initials = admin.name_ko ? getInitials(admin.name_ko) : '?'
              const avatarColor = admin.name_ko ? getAvatarColor(admin.name_ko) : 'var(--color-gray-400)'
              const isSelf = admin.user_id === currentUserId
              const isLast = admins.length === 1
              const isRemoving = loading === admin.user_id
              const canRemove = !isSelf && !isLast

              return (
                <div
                  key={admin.user_id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 flex items-center gap-4"
                >
                  {admin.avatar_url ? (
                    <Image
                      src={admin.avatar_url}
                      alt={admin.name_ko ?? ''}
                      width={44}
                      height={44}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-text)]">
                        {admin.name_ko ?? t('unknownName')}
                      </span>
                      {isSelf && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium">
                          {t('selfBadge')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {t('registeredAt', { date: formatDate(admin.added_at, locale) })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(admin.user_id)}
                    disabled={!canRemove || isRemoving}
                    title={
                      isSelf
                        ? t('cannotRemoveSelf')
                        : isLast
                        ? t('cannotRemoveLast')
                        : t('removeTitle')
                    }
                    className={cn(
                      'px-4 py-2 rounded-xl border border-[var(--color-danger-200)] text-[var(--color-danger-600)] text-sm font-medium hover:bg-[var(--color-danger-50)] disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0',
                      btnDestructive
                    )}
                  >
                    {isRemoving ? t('removing') : t('remove')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
