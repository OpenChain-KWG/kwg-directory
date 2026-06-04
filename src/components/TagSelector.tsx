'use client'

import { useState } from 'react'
import { InterestTag, TAG_CATEGORIES } from '@/constants/tags'
import { cn } from '@/lib/utils'
import { btnGhost } from '@/lib/button-styles'

interface Props {
  selected: InterestTag[]
  onChange: (tags: InterestTag[]) => void
  max?: number
}

export default function TagSelector({ selected, onChange, max = 10 }: Props) {
  const [tooltip, setTooltip] = useState(false)

  const toggle = (tag: InterestTag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      if (selected.length >= max) {
        setTooltip(true)
        setTimeout(() => setTooltip(false), 2000)
        return
      }
      onChange([...selected, tag])
    }
  }

  return (
    <div className="space-y-4">
      {/* 선택 카운터 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          최대 {max}개까지 선택 가능합니다
        </span>
        <span className="text-xs font-semibold text-[var(--color-primary)]">
          {selected.length} / {max}
        </span>
      </div>

      {/* 카테고리별 태그 */}
      {TAG_CATEGORIES.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => {
              const isSelected = selected.includes(tag)
              const isDisabled = !isSelected && selected.length >= max
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border',
                    !isDisabled && btnGhost,
                    isSelected
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:shadow-sm hover:-translate-y-0.5'
                      : isDisabled
                        ? 'border-[var(--color-border)] text-[var(--color-text-muted)] opacity-40 cursor-not-allowed transition-none'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  )}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* 초과 시 툴팁 */}
      {tooltip && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[var(--color-text)] text-[var(--color-surface)] text-sm shadow-lg animate-fade-in"
        >
          최대 {max}개까지 선택 가능합니다
        </div>
      )}
    </div>
  )
}
