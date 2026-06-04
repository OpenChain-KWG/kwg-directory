'use client'

import * as React from 'react'

/**
 * DirectoryListContext — exposes the ordered list of currently-visible member
 * IDs to the intercepted detail sheet so ←/→ keyboard navigation knows the
 * neighbour to jump to without re-running the directory query.
 *
 * The orchestrator (`DirectoryV2Page`) provides the array; the intercepted
 * `(.)members/[id]` sheet consumes it. When the sheet is rendered as a hard
 * navigation (full-page detail), the context is absent and prev/next are
 * disabled — the sheet handles that case gracefully.
 */
export interface DirectoryListContextValue {
  /** Member IDs in current sort order. */
  ids: readonly string[]
}

const DirectoryListContext = React.createContext<DirectoryListContextValue | null>(
  null,
)

export interface DirectoryListProviderProps {
  ids: readonly string[]
  children: React.ReactNode
}

export function DirectoryListProvider({
  ids,
  children,
}: DirectoryListProviderProps) {
  const value = React.useMemo<DirectoryListContextValue>(() => ({ ids }), [ids])
  return (
    <DirectoryListContext.Provider value={value}>
      {children}
    </DirectoryListContext.Provider>
  )
}

/** Returns the directory list context; null when detail page is hard-loaded. */
export function useDirectoryList(): DirectoryListContextValue | null {
  return React.useContext(DirectoryListContext)
}

const STORAGE_KEY = 'kwg.directoryList.ids'

/**
 * Persist the visible-id list to sessionStorage so a hard reload of the detail
 * page can still hydrate prev/next neighbours. Best-effort — falls back to no
 * neighbours when storage is unavailable.
 */
export function persistDirectoryIds(ids: readonly string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore quota / privacy mode failures
  }
}

export function readPersistedDirectoryIds(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return null
  }
}
