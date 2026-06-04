'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { cn } from '@/lib/utils'

import type { DirectorySort } from './sort'

export const ALL_FILTER = '전체' as const
export type CategoryFilterValue = string

export interface DirectoryFiltersProps {
  /** Available category labels shown as chips (in display order). */
  categories: readonly string[]
  /** Currently selected category, or ALL_FILTER for no filter. */
  category: CategoryFilterValue
  onCategoryChange: (next: CategoryFilterValue) => void
  /** Currently selected sort key. */
  sort: DirectorySort
  onSortChange: (next: DirectorySort) => void
  className?: string
}

const SORT_OPTION_KEYS: { value: DirectorySort; labelKey: 'sortByName' | 'sortByJoined' | 'sortRandom' }[] = [
  { value: 'name', labelKey: 'sortByName' },
  { value: 'joined', labelKey: 'sortByJoined' },
  { value: 'random', labelKey: 'sortRandom' },
]

/**
 * DirectoryFilters — chip-based category radio + sort Select.
 *
 * Single-select chips render as a `radiogroup` with chip buttons. Sorting uses
 * the token-driven Select primitive. All visuals come from design tokens.
 */
export function DirectoryFilters({
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  className,
}: DirectoryFiltersProps) {
  const t = useTranslations('directoryFilters')
  const chips = React.useMemo(
    () => [ALL_FILTER, ...categories],
    [categories],
  )

  return (
    <div
      data-testid="directory-v2-filters"
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div
        role="radiogroup"
        aria-label={t('groupLabel')}
        className="flex flex-wrap items-center gap-1.5"
      >
        {chips.map((chip) => {
          const selected = chip === category
          // `chip`은 카테고리 식별자 값(DB enum)이며 ALL_FILTER만 라벨을 번역한다.
          const label = chip === ALL_FILTER ? t('all') : chip
          return (
            <button
              key={chip}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid="directory-v2-filter-chip"
              data-value={chip}
              onClick={() => onCategoryChange(chip)}
              className={cn(
                // 시각 크기는 h-8 유지하되, 보이지 않는 before 오버레이로
                // 실제 터치 타겟을 세로 44px(min-h-11)로 확장한다 (WCAG 2.5.5).
                'relative inline-flex h-8 items-center rounded-full px-3 text-sm font-medium',
                'before:absolute before:left-0 before:right-0 before:top-1/2 before:min-h-11 before:-translate-y-1/2 before:content-[""]',
                'border transition-colors duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
                selected
                  ? 'border-[var(--color-state-primary)] bg-[var(--color-state-primary)] text-[var(--color-text-on-brand)]'
                  : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-default)] hover:bg-[var(--color-bg-surface-alt)]',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <span
          id="directory-v2-sort-label"
          className="text-sm text-[var(--color-text-muted)]"
        >
          {t('sortLabel')}
        </span>
        <Select
          value={sort}
          onValueChange={(next) => onSortChange(next as DirectorySort)}
        >
          <SelectTrigger
            data-testid="directory-v2-sort-select"
            aria-labelledby="directory-v2-sort-label"
            className="h-9 min-w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTION_KEYS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
