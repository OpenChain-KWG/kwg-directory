'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { uploadAvatar } from '@/lib/uploadAvatar'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface Props {
  currentUrl?: string
  userId: string
  name: string
  onUpload: (url: string) => void
}

export default function AvatarUpload({ currentUrl, userId, name, onUpload }: Props) {
  const t = useTranslations('avatarUpload')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const url = await uploadAvatar(file, userId, previewUrl)
        setPreviewUrl(url)
        onUpload(url)
      } catch (e) {
        showToast(e instanceof Error ? e.message : t('uploadFailed'))
      } finally {
        setUploading(false)
      }
    },
    [userId, previewUrl, onUpload, t]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const initials = getInitials(name || '?')
  const avatarColor = getAvatarColor(name || '?')

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 원형 업로드 영역 */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t('changeAvatar')}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-24 h-24 rounded-full cursor-pointer overflow-hidden
          ring-2 ring-offset-2 transition-all
          ${isDragging ? 'ring-[var(--color-primary)] scale-105' : 'ring-[var(--color-border)] hover:ring-[var(--color-primary)]'}
          focus-visible:outline-none focus-visible:ring-[var(--color-focus-ring)]`}
      >
        {/* 아바타 */}
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={t('avatarAlt')}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
        )}

        {/* 업로드 중 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* 호버 오버레이 */}
        {!uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">{t('hint')}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />

      {/* 토스트 메시지 */}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[var(--color-state-danger)] text-[var(--color-text-on-brand)] text-sm shadow-lg animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
