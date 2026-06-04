'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'

import { IconButton, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DirectorySearchBarProps {
  /** Current debounced value (controlled). */
  value: string
  /** Fires after the debounce window with the latest input. */
  onChange: (next: string) => void
  /** Optional id used to wire aria-controls from filters/results. */
  id?: string
  /** Tailwind class hook for the outer wrapper. */
  className?: string
  /** Override debounce window. Defaults to 300ms. */
  debounceMs?: number
}

/**
 * DirectorySearchBar — sticky search input with `/` shortcut focus.
 *
 * - Mirrors the input locally to debounce upstream re-renders (300ms default).
 * - `/` (when no other input is focused) focuses the field.
 * - `Escape` clears + blurs to recover scroll context.
 * - Token-only colors via Input primitive; icons from lucide.
 */
export function DirectorySearchBar({
  value,
  onChange,
  id = 'directory-v2-search',
  className,
  debounceMs = 300,
}: DirectorySearchBarProps) {
  const t = useTranslations('directorySearch')
  const [local, setLocal] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Sync external resets back into the local input.
  React.useEffect(() => {
    setLocal((prev) => (prev === value ? prev : value))
  }, [value])

  // Debounce upstream propagation.
  React.useEffect(() => {
    if (local === value) return
    const handle = window.setTimeout(() => onChangeRef.current(local), debounceMs)
    return () => window.clearTimeout(handle)
  }, [local, value, debounceMs])

  // `/` shortcut → focus the search input (when not already typing in a field).
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/') return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isEditable =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT'
      if (isEditable) return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleClear = React.useCallback(() => {
    setLocal('')
    onChangeRef.current('')
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && local) {
        event.preventDefault()
        handleClear()
      }
    },
    [handleClear, local],
  )

  return (
    <div
      role="search"
      className={cn('relative flex w-full items-center gap-2', className)}
    >
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]"
        />
        <Input
          ref={inputRef}
          id={id}
          data-testid="directory-v2-search-input"
          type="search"
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-keyshortcuts="/"
          autoComplete="off"
          spellCheck={false}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-20"
        />
        <kbd
          aria-hidden
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center sm:flex',
            'rounded-sm border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-alt)] px-1.5 py-0.5',
            'font-mono text-xs text-[var(--color-text-muted)]',
            local ? 'opacity-0' : 'opacity-100',
            'transition-opacity duration-150 ease-out',
          )}
        >
          /
        </kbd>
        {local && (
          <IconButton
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('searchClear')}
            data-testid="directory-v2-search-clear"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <X aria-hidden />
          </IconButton>
        )}
      </div>
    </div>
  )
}
