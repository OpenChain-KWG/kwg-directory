'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import type { RowSelectionState } from '@tanstack/react-table'

import { Member } from '@/types/member'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { DataTable } from '@/components/patterns'
import type { DataTableColumnDef } from '@/components/patterns'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from '@/components/ui'

interface Props {
  initialPending: Member[]
}

type InviteStatus = 'sent' | 'failed' | 'skipped'
type BulkResult = { success: number; failure: number }

const REJECT_REASON_KEYS = [
  'ineligible',
  'companyUnverified',
  'incompleteInfo',
  'other',
] as const
type RejectReasonKey = (typeof REJECT_REASON_KEYS)[number]

function MiniAvatar({ member, size = 32 }: { member: Pick<Member, 'name_ko' | 'avatar_url'>; size?: number }) {
  const initials = getInitials(member.name_ko)
  const color = getAvatarColor(member.name_ko)
  if (member.avatar_url) {
    return (
      <Image
        src={member.avatar_url}
        alt={member.name_ko}
        width={size}
        height={size}
        className="rounded-full flex-shrink-0 object-cover"
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

export default function PendingMembersTable({ initialPending }: Props) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [pending, setPending] = useState(initialPending)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Detail sheet
  const [detailMember, setDetailMember] = useState<Member | null>(null)

  // Reject dialog — single or bulk
  const [rejectMode, setRejectMode] = useState<'single' | 'bulk' | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Member | null>(null)
  const [rejectReason, setRejectReason] = useState<RejectReasonKey | ''>('')
  const [customReason, setCustomReason] = useState('')

  // Feedback (개별 액션은 sonner toast, 벌크는 인라인 진행/결과)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)

  const reasonLabel = (key: RejectReasonKey) => t(`reject.reasons.${key}`)
  const finalReason =
    rejectReason === '' ? '' : rejectReason === 'other' ? customReason.trim() : reasonLabel(rejectReason)

  const selectedIds = useMemo(
    () => pending.filter((_, i) => rowSelection[i]).map((m) => m.id),
    [pending, rowSelection],
  )
  const selectedMembers = useMemo(
    () => pending.filter((_, i) => rowSelection[i]),
    [pending, rowSelection],
  )
  const selectedCount = selectedIds.length

  const removeMembers = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setPending((prev) => prev.filter((m) => !idSet.has(m.id)))
    setRowSelection({})
  }, [])

  // ── Single approve ─────────────────────────────────────────────
  const approveOne = useCallback(async (id: string): Promise<InviteStatus> => {
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) throw new Error('approve failed')
    const result = (await res.json()) as { inviteStatus?: InviteStatus }
    return result.inviteStatus ?? 'skipped'
  }, [])

  const handleApprove = useCallback(
    async (member: Member) => {
      // Optimistic: 즉시 목록에서 제거 → 실패 시 복원.
      setPending((prev) => prev.filter((m) => m.id !== member.id))
      setRowSelection({})
      try {
        const inviteStatus = await approveOne(member.id)
        toast.success(t(`approveToast.${inviteStatus}`, { name: member.name_ko }))
      } catch {
        setPending((prev) =>
          prev.some((m) => m.id === member.id) ? prev : [member, ...prev],
        )
        toast.error(t('actions.errorMessage'))
      }
    },
    [approveOne, t],
  )

  // ── Single reject ──────────────────────────────────────────────
  const rejectOne = useCallback(async (id: string, reason: string): Promise<void> => {
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reason }),
    })
    if (!res.ok) throw new Error('reject failed')
  }, [])

  const openReject = (member: Member) => {
    setRejectMode('single')
    setRejectTarget(member)
    setRejectReason('')
    setCustomReason('')
  }

  const openBulkReject = () => {
    setRejectMode('bulk')
    setRejectTarget(null)
    setRejectReason('')
    setCustomReason('')
  }

  const closeReject = () => {
    setRejectMode(null)
    setRejectTarget(null)
    setRejectReason('')
    setCustomReason('')
  }

  const handleRejectConfirm = useCallback(async () => {
    if (!finalReason) return

    if (rejectMode === 'single' && rejectTarget) {
      setLoadingId(rejectTarget.id)
      try {
        await rejectOne(rejectTarget.id, finalReason)
        removeMembers([rejectTarget.id])
        closeReject()
      } catch {
        toast.error(t('actions.errorMessage'))
      } finally {
        setLoadingId(null)
      }
      return
    }

    if (rejectMode === 'bulk') {
      const ids = [...selectedIds]
      closeReject()
      let success = 0
      let failure = 0
      const done: string[] = []
      setBulkResult(null)
      setBulkProgress({ done: 0, total: ids.length })
      // Sequential to respect admin rate-limit (30/60s).
      for (let i = 0; i < ids.length; i++) {
        try {
          await rejectOne(ids[i], finalReason)
          success += 1
          done.push(ids[i])
        } catch {
          failure += 1
        }
        setBulkProgress({ done: i + 1, total: ids.length })
      }
      removeMembers(done)
      setBulkProgress(null)
      setBulkResult({ success, failure })
    }
  }, [finalReason, rejectMode, rejectTarget, rejectOne, removeMembers, selectedIds, t])

  // ── Bulk approve ───────────────────────────────────────────────
  const handleBulkApprove = useCallback(async () => {
    const members = [...selectedMembers]
    let success = 0
    let failure = 0
    const done: string[] = []
    setBulkResult(null)
    setBulkProgress({ done: 0, total: members.length })
    for (let i = 0; i < members.length; i++) {
      try {
        await approveOne(members[i].id)
        success += 1
        done.push(members[i].id)
      } catch {
        failure += 1
      }
      setBulkProgress({ done: i + 1, total: members.length })
    }
    removeMembers(done)
    setBulkProgress(null)
    setBulkResult({ success, failure })
  }, [approveOne, removeMembers, selectedMembers])

  const bulkBusy = bulkProgress !== null

  // ── Columns ────────────────────────────────────────────────────
  const columns = useMemo<DataTableColumnDef<Member>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name_ko',
        header: () => t('table.columnName'),
        cell: ({ row }) => {
          const m = row.original
          return (
            <div className="flex items-center gap-2.5">
              <MiniAvatar member={m} />
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-text-default)] truncate">
                  {m.name_ko}
                  {m.name_en && (
                    <span className="ml-1.5 text-xs text-[var(--color-text-muted)] font-normal">
                      {m.name_en}
                    </span>
                  )}
                </p>
                {m.role && (
                  <p className="max-w-40 truncate text-xs text-[var(--color-text-muted)]">
                    {m.role}
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        id: 'company',
        accessorKey: 'company',
        header: () => t('table.columnCompany'),
        cell: ({ row }) => (
          <span className="text-[var(--color-text-muted)]">{row.original.company}</span>
        ),
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: () => t('table.columnCategory'),
        cell: ({ row }) =>
          row.original.category ? (
            <Badge variant="secondary">{row.original.category}</Badge>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">{t('table.noCategory')}</span>
          ),
      },
      {
        id: 'appliedAt',
        accessorKey: 'created_at',
        header: () => t('table.columnAppliedAt'),
        cell: ({ row }) => (
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDate(row.original.created_at, locale)}
          </span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">{t('table.columnActions')}</span>,
        cell: ({ row }) => {
          const m = row.original
          const isLoading = loadingId === m.id
          return (
            <div
              data-member-id={m.id}
              className="flex items-center justify-end gap-1.5"
            >
              <Button
                variant="destructive"
                size="sm"
                disabled={isLoading || bulkBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  openReject(m)
                }}
              >
                {t('actions.reject')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isLoading}
                disabled={isLoading || bulkBusy}
                onClick={(e) => {
                  e.stopPropagation()
                  void handleApprove(m)
                }}
              >
                {t('actions.approve')}
              </Button>
            </div>
          )
        },
      },
    ],
    [t, locale, loadingId, bulkBusy, handleApprove],
  )

  const detailRows: { label: string; value: string }[] = detailMember
    ? [
        { label: t('detailSheet.appliedAt'), value: formatDate(detailMember.created_at, locale) },
        { label: t('detailSheet.contactEmail'), value: detailMember.contact_email || detailMember.email || '—' },
        {
          label: t('detailSheet.mailing'),
          value: detailMember.subscribe_mailing_list
            ? t('detailSheet.mailingSubscribed')
            : t('detailSheet.mailingNotSubscribed'),
        },
      ]
    : []

  return (
    <div>
      {/* aria-live: 벌크 진행/결과 (개별 승인·거절 토스트는 sonner가 announce) */}
      <div aria-live="polite" className="sr-only">
        {bulkProgress
          ? t('bulk.processing', { done: bulkProgress.done, total: bulkProgress.total })
          : null}
        {bulkResult
          ? t('bulk.result', { success: bulkResult.success, failure: bulkResult.failure })
          : null}
      </div>

      {/* 벌크 액션 바 */}
      {(selectedCount > 0 || bulkBusy) && (
        <div
          data-testid="admin-bulk-bar"
          className={cn(
            'sticky top-2 z-sticky mb-4 flex flex-wrap items-center gap-3',
            'rounded-lg border border-[var(--color-border-default)]',
            'bg-[var(--color-bg-surface-alt)] px-4 py-2.5',
          )}
        >
          <span className="text-sm font-medium text-[var(--color-text-default)]">
            {bulkBusy && bulkProgress
              ? t('bulk.processing', { done: bulkProgress.done, total: bulkProgress.total })
              : t('bulk.summary', { count: selectedCount })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkBusy}
              data-testid="admin-bulk-clear-btn"
              onClick={() => setRowSelection({})}
            >
              {t('bulk.clear')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkBusy || selectedCount === 0}
              data-testid="admin-bulk-reject-btn"
              onClick={openBulkReject}
            >
              {t('bulk.reject')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={bulkBusy}
              disabled={bulkBusy || selectedCount === 0}
              data-testid="admin-bulk-approve-btn"
              onClick={() => void handleBulkApprove()}
            >
              {t('bulk.approve')}
            </Button>
          </div>
        </div>
      )}

      {/* 벌크 결과 요약 */}
      {bulkResult && (
        <div
          role="status"
          data-testid="admin-bulk-result"
          className="mb-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-2.5 text-sm text-[var(--color-text-default)]"
        >
          {t('bulk.result', { success: bulkResult.success, failure: bulkResult.failure })}
        </div>
      )}

      {/* 데이터 테이블 */}
      <div data-testid="admin-table">
        <DataTable<Member>
          data={pending}
          columns={columns}
          enableRowSelection
          onSelectionChange={setRowSelection}
          onRowClick={(m) => setDetailMember(m)}
          initialPageSize={10}
          emptyTitle={t('emptyPending')}
          labels={{
            paginationLabel: t('table.pagination'),
            selectAllLabel: t('table.selectAll'),
            selectRowLabel: (i) => t('table.selectRow', { index: i + 1 }),
            sortColumnLabel: (id) => t('table.sortColumn', { column: id }),
            selectedRows: (selected, total) => t('table.selectedRows', { selected, total }),
          }}
        />
      </div>

      {/* 상세 보기 시트 */}
      <Sheet open={detailMember !== null} onOpenChange={(open) => !open && setDetailMember(null)}>
        <SheetContent side="right" data-testid="admin-member-detail-sheet" className="overflow-y-auto">
          {detailMember && (
            <>
              <SheetHeader>
                <SheetTitle>{t('detailSheet.title')}</SheetTitle>
                <SheetDescription className="sr-only">{t('detailSheet.title')}</SheetDescription>
              </SheetHeader>

              <div className="flex items-center gap-4 mb-6">
                <MiniAvatar member={detailMember} size={56} />
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-text-default)] text-lg truncate">
                    {detailMember.name_ko}
                  </p>
                  {detailMember.name_en && (
                    <p className="text-sm text-[var(--color-text-muted)] truncate">{detailMember.name_en}</p>
                  )}
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5 truncate">
                    {detailMember.company}
                    {detailMember.role ? ` · ${detailMember.role}` : ''}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                {detailRows.map((r) => (
                  <div key={r.label}>
                    <dt className="text-xs text-[var(--color-text-muted)]">{r.label}</dt>
                    <dd className="text-[var(--color-text-default)] mt-0.5 break-all">{r.value}</dd>
                  </div>
                ))}
                {detailMember.category && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">{t('detailSheet.category')}</dt>
                    <dd className="text-[var(--color-text-default)] mt-0.5">{detailMember.category}</dd>
                  </div>
                )}
                {detailMember.bio && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)]">{t('detailSheet.bio')}</dt>
                    <dd className="text-[var(--color-text-default)] mt-0.5 break-words">{detailMember.bio}</dd>
                  </div>
                )}
                {detailMember.tags && detailMember.tags.length > 0 && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)] mb-1">{t('detailSheet.tags')}</dt>
                    <dd className="flex flex-wrap gap-1">
                      {detailMember.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
                {(detailMember.linkedin || detailMember.github || detailMember.discord || detailMember.blog) && (
                  <div>
                    <dt className="text-xs text-[var(--color-text-muted)] mb-1">{t('detailSheet.links')}</dt>
                    <dd className="space-y-1 break-all text-[var(--color-text-default)]">
                      {detailMember.linkedin && <p>LinkedIn: {detailMember.linkedin}</p>}
                      {detailMember.github && <p>GitHub: {detailMember.github}</p>}
                      {detailMember.discord && <p>Discord: {detailMember.discord}</p>}
                      {detailMember.blog && <p>Blog: {detailMember.blog}</p>}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 거절 사유 모달 (단일·벌크 공용) */}
      <Dialog open={rejectMode !== null} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent data-testid="admin-reject-dialog">
          <DialogHeader>
            <DialogTitle>
              {rejectMode === 'bulk' ? t('bulk.rejectTitle') : t('reject.title')}
            </DialogTitle>
            <DialogDescription>
              {rejectMode === 'bulk'
                ? t('bulk.rejectDescription', { count: selectedCount })
                : t('reject.description', { name: rejectTarget?.name_ko ?? '' })}
            </DialogDescription>
          </DialogHeader>

          {/* 거절 사유 입력 — 텍스트 노출 (E2E 식별용) */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="admin-reject-reason"
                className="block text-sm font-medium text-[var(--color-text-default)] mb-1.5"
              >
                {t('reject.selectLabel')}
              </label>
              <select
                id="admin-reject-reason"
                data-testid="admin-reject-select"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value as RejectReasonKey | '')}
                className={cn(
                  'w-full px-3 py-2.5 rounded-md text-sm',
                  'border border-[var(--color-border-default)]',
                  'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                )}
              >
                <option value="">{t('reject.selectPlaceholder')}</option>
                {REJECT_REASON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {reasonLabel(key)}
                  </option>
                ))}
              </select>
            </div>
            {rejectReason === 'other' && (
              <div>
                <label
                  htmlFor="admin-reject-custom"
                  className="block text-sm font-medium text-[var(--color-text-default)] mb-1.5"
                >
                  {t('reject.customLabel')}
                </label>
                <textarea
                  id="admin-reject-custom"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('reject.customPlaceholder')}
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-md text-sm resize-none',
                    'border border-[var(--color-border-default)]',
                    'bg-[var(--color-bg-surface)] text-[var(--color-text-default)]',
                    'placeholder:text-[var(--color-text-faint)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                  )}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" disabled={loadingId !== null} onClick={closeReject}>
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              data-testid="admin-reject-confirm-btn"
              loading={loadingId !== null && rejectMode === 'single'}
              disabled={!finalReason || loadingId !== null}
              onClick={() => void handleRejectConfirm()}
            >
              {t('reject.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
