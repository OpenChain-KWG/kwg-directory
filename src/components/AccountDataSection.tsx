'use client'

/**
 * AccountDataSection — GDPR 자기정보 통제 UI (profile/edit 하단).
 *
 * - 데이터 내보내기: GET /api/me/export (Art. 20) → JSON 파일 다운로드
 * - 계정 삭제: DELETE /api/me/delete (Art. 17) → 확인 토큰 입력 후 영구 삭제
 *
 * 삭제는 포괄 삭제(members·notifications·audit·storage + 세션 초기화)로,
 * 기존 단순 탈퇴(/api/members/me)를 UI 상 대체한다.
 */

import { useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'

// 삭제 확인 토큰 — API 계약상 고정 식별자(번역 대상 아님)
const DELETE_TOKEN = 'DELETE-MY-ACCOUNT'

export default function AccountDataSection() {
  const t = useTranslations('account')
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/me/export')
      if (res.status === 429) {
        toast.error(t('export.rateLimited'))
        return
      }
      if (!res.ok) {
        toast.error(t('export.error'))
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = disposition.match(/filename="([^"]+)"/)
      const filename = match?.[1] ?? 'kwg-directory-export.json'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(t('export.success'))
    } catch {
      toast.error(t('export.error'))
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/me/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: DELETE_TOKEN }),
      })
      if (res.status === 429) {
        toast.error(t('delete.rateLimited'))
        setDeleting(false)
        return
      }
      if (res.status !== 204) {
        toast.error(t('delete.error'))
        setDeleting(false)
        return
      }
      // 세션 쿠키가 서버에서 제거됨 → 전체 리로드로 홈 이동
      window.location.assign('/')
    } catch {
      toast.error(t('delete.error'))
      setDeleting(false)
    }
  }

  const confirmValid = confirmText.trim() === DELETE_TOKEN

  return (
    <section
      data-testid="account-data-section"
      className="mt-16 border-t border-[var(--color-border-subtle)] pt-10"
      aria-labelledby="account-data-heading"
    >
      <h2
        id="account-data-heading"
        className="mb-2 text-xl font-semibold text-[var(--color-text)]"
      >
        {t('title')}
      </h2>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">{t('description')}</p>

      {/* 데이터 내보내기 */}
      <div className="mb-8 rounded-lg border border-[var(--color-border-subtle)] p-5">
        <h3 className="mb-1 font-medium text-[var(--color-text)]">{t('export.title')}</h3>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">{t('export.description')}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          loading={exporting}
          disabled={exporting}
          data-testid="account-export-btn"
        >
          <Download className="size-4" aria-hidden="true" />
          {t('export.button')}
        </Button>
      </div>

      {/* 계정 삭제 */}
      <div className="rounded-lg border border-[var(--color-border-default)] p-5">
        <h3 className="mb-1 flex items-center gap-2 font-medium text-[var(--color-state-danger)]">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {t('delete.title')}
        </h3>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">{t('delete.description')}</p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          data-testid="account-delete-btn"
        >
          {t('delete.button')}
        </Button>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteOpen(open)
            if (!open) setConfirmText('')
          }
        }}
      >
        <DialogContent data-testid="account-delete-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-[var(--color-state-danger)]" aria-hidden="true" />
              {t('delete.dialogTitle')}
            </DialogTitle>
            <DialogDescription>{t('delete.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="account-delete-confirm">
              {t('delete.confirmLabel', { token: DELETE_TOKEN })}
            </Label>
            <Input
              id="account-delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={DELETE_TOKEN}
              autoComplete="off"
              data-testid="account-delete-confirm-input"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false)
                setConfirmText('')
              }}
              disabled={deleting}
            >
              {t('delete.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
              disabled={!confirmValid || deleting}
              data-testid="account-delete-confirm-btn"
            >
              {t('delete.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
