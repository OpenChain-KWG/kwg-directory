'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Mail,
  ShieldMinus,
  ShieldPlus,
  Trash2,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/patterns'
import { Spinner } from '@/components/ui'

export type ActivityLogEntry = {
  id: string
  action: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  created_at: string
}

type ActionMeta = {
  labelKey: string
  Icon: typeof CheckCircle2
  tone: 'success' | 'danger' | 'info' | 'muted'
}

const ACTION_META: Record<string, ActionMeta> = {
  'member.approve': { labelKey: 'actions.memberApprove', Icon: CheckCircle2, tone: 'success' },
  'member.reject': { labelKey: 'actions.memberReject', Icon: XCircle, tone: 'danger' },
  'member.reinvite': { labelKey: 'actions.memberReinvite', Icon: Mail, tone: 'info' },
  'admin.add': { labelKey: 'actions.adminAdd', Icon: ShieldPlus, tone: 'info' },
  'admin.remove': { labelKey: 'actions.adminRemove', Icon: ShieldMinus, tone: 'muted' },
  'admin.revoke': { labelKey: 'actions.adminRevoke', Icon: ShieldMinus, tone: 'muted' },
  'me.export': { labelKey: 'actions.meExport', Icon: Download, tone: 'info' },
  'me.delete': { labelKey: 'actions.meDelete', Icon: Trash2, tone: 'danger' },
}

const TONE_CLASS: Record<ActionMeta['tone'], string> = {
  success: 'bg-[var(--color-success-100)] text-[var(--color-success-700)]',
  danger: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)]',
  info: 'bg-[var(--color-info-100)] text-[var(--color-info-700)]',
  muted: 'bg-[var(--color-bg-surface-muted)] text-[var(--color-text-muted)]',
}

/** Relative-time formatter with a graceful absolute fallback. */
function useRelativeTime(locale: string) {
  return (iso: string): string => {
    const date = new Date(iso)
    const diffMs = date.getTime() - Date.now()
    const abs = Math.abs(diffMs)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const minute = 60_000
    const hour = 60 * minute
    const day = 24 * hour
    if (abs < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
    if (abs < day) return rtf.format(Math.round(diffMs / hour), 'hour')
    if (abs < 7 * day) return rtf.format(Math.round(diffMs / day), 'day')
    return date.toLocaleDateString(locale)
  }
}

interface Props {
  /** Optional preloaded entries (used by tests / SSR). When omitted, fetches on mount. */
  initialEntries?: ActivityLogEntry[]
  /** 명시 시 활성 로케일을 덮어쓴다(테스트/SSR용). 생략 시 next-intl 활성 로케일 사용. */
  locale?: string
}

export default function ActivityFeed({ initialEntries, locale: localeProp }: Props) {
  const t = useTranslations('admin.activity')
  const activeLocale = useLocale()
  const relative = useRelativeTime(localeProp ?? activeLocale)
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(initialEntries ?? null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(initialEntries === undefined)

  useEffect(() => {
    if (initialEntries !== undefined) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch('/api/admin/activity')
        if (!res.ok) throw new Error('failed')
        const json = (await res.json()) as { activity: ActivityLogEntry[] }
        if (!cancelled) setEntries(json.activity ?? [])
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialEntries])

  return (
    <section data-testid="admin-activity-feed" aria-label={t('title')}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner label={t('title')} />
        </div>
      ) : error ? (
        <EmptyState
          illustration={<AlertTriangle className="h-7 w-7" aria-hidden />}
          title={t('loadError')}
        />
      ) : !entries || entries.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action]
            const Icon = meta?.Icon ?? CheckCircle2
            const tone = meta?.tone ?? 'muted'
            const label = meta ? t(meta.labelKey) : t('actions.unknown')
            return (
              <li
                key={entry.id}
                data-testid="admin-activity-item"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5',
                  'border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]',
                )}
              >
                <span
                  className={cn('flex h-8 w-8 items-center justify-center rounded-full', TONE_CLASS[tone])}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-default)]">{label}</p>
                  {entry.target_id && (
                    <p className="truncate text-xs text-[var(--color-text-muted)]">{entry.target_id}</p>
                  )}
                </div>
                <time
                  dateTime={entry.created_at}
                  className="flex-shrink-0 text-xs text-[var(--color-text-muted)]"
                >
                  {relative(entry.created_at)}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
