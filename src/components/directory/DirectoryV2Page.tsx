'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import type { Member } from '@/types/member'

import { DirectoryCommandMenu } from './DirectoryCommandMenu'
import { DirectoryEmptyState } from './DirectoryEmptyState'
import { DirectoryFilters, ALL_FILTER } from './DirectoryFilters'
import { DirectoryGrid } from './DirectoryGrid'
import { DirectoryGridSkeleton } from './DirectoryGridSkeleton'
import { DirectoryHero } from './DirectoryHero'
import {
  DirectoryListProvider,
  persistDirectoryIds,
} from './DirectoryListContext'
import { DirectorySearchBar } from './DirectorySearchBar'
import { DirectoryVirtualGrid } from './DirectoryVirtualGrid'
import { MemberCardV2 } from './MemberCardV2'
import { type DirectorySort } from './sort'

export interface DirectoryV2PageProps {
  /** Server-rendered initial members (post-RLS). */
  initialMembers: Member[]
  /** Total approved members reported by the server. */
  initialTotal: number
  /** Whether the viewer is logged in. Drives Hero variant + email visibility. */
  isAuthenticated: boolean
  /** Whether the viewer is an admin. Surfaces admin shortcut in CommandMenu. */
  isAdmin?: boolean
  /**
   * Categories to show as filter chips. When omitted, the page derives the
   * unique set from the initial members.
   */
  categories?: readonly string[]
  /** Server action passed to the guest hero — GitHub login. */
  onGithubLogin?: () => void | Promise<void>
  /** Server action passed to the guest hero — Google login. */
  onGoogleLogin?: () => void | Promise<void>
  /** Server action passed to the CommandMenu — sign out. */
  onLogout?: () => void | Promise<void>
  /**
   * Force the virtualized renderer for the card grid. Default is `auto`
   * (virtualize when a page returns ≥100 cards). Useful for tests/storybook.
   */
  virtualize?: 'auto' | 'on' | 'off'
  /** Cards per page for the search-backed pagination. Defaults to 24. */
  pageSize?: number
}

const DEFAULT_CATEGORIES = ['기업', '연구/공공', '학계'] as const
const DEFAULT_PAGE_SIZE = 24
const VIRTUALIZE_THRESHOLD = 100
const DEBOUNCE_MS = 300

interface SearchResponse {
  members: Member[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * DirectoryV2Page — orchestrator for the redesigned `/` directory.
 *
 * Chunk 2 scope:
 *   - Server-backed pagination/search/sort via `/api/members/search`.
 *   - Auto-virtualized grid when the response contains ≥100 cards.
 *   - CommandMenu (Cmd+K) wired with quick actions, member search,
 *     theme toggle hook (caller provides `onToggleTheme` later).
 *   - DirectoryListProvider exposes the visible IDs to the intercepted
 *     `/members/[id]` sheet for ←/→ neighbour navigation.
 *
 * Out of scope: theme toggle implementation (Phase 4),
 *   E2E (트랙 E), Lighthouse measurement (트랙 E).
 */
export function DirectoryV2Page({
  initialMembers,
  initialTotal,
  isAuthenticated,
  isAdmin = false,
  categories,
  onGithubLogin,
  onGoogleLogin,
  onLogout,
  virtualize = 'auto',
  pageSize = DEFAULT_PAGE_SIZE,
}: DirectoryV2PageProps) {
  const t = useTranslations('directoryV2Page')
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<string>(ALL_FILTER)
  const [sort, setSort] = React.useState<DirectorySort>('name')
  const [page, setPage] = React.useState<number>(1)

  const [members, setMembers] = React.useState<Member[]>(initialMembers)
  const [total, setTotal] = React.useState<number>(initialTotal)
  const [totalPages, setTotalPages] = React.useState<number>(
    Math.max(1, Math.ceil(initialTotal / pageSize)),
  )
  const [loading, setLoading] = React.useState(false)

  // Derive chip set when caller did not pass one.
  const chipCategories = React.useMemo<readonly string[]>(() => {
    if (categories && categories.length > 0) return categories
    const seen = new Set<string>()
    initialMembers.forEach((m) => {
      if (m.category) seen.add(m.category)
    })
    if (seen.size === 0) return DEFAULT_CATEGORIES
    const known = DEFAULT_CATEGORIES.filter((c) => seen.has(c))
    const known_set = new Set<string>(known)
    const extras = [...seen].filter((c) => !known_set.has(c))
    return [...known, ...extras]
  }, [categories, initialMembers])

  const apiSort = React.useMemo<'name' | 'recent' | 'random'>(() => {
    if (sort === 'joined') return 'recent'
    if (sort === 'random') return 'random'
    return 'name'
  }, [sort])

  // Reset to page 1 whenever the query/filter/sort changes.
  const isFirstRender = React.useRef(true)
  React.useEffect(() => {
    if (isFirstRender.current) return
    setPage(1)
  }, [search, category, sort])

  // Debounced server fetch.
  React.useEffect(() => {
    if (!isAuthenticated) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      // Initial mount: keep server-rendered data, just compute totalPages.
      setTotalPages(Math.max(1, Math.ceil(initialTotal / pageSize)))
      return
    }
    const ctrl = new AbortController()
    const handle = window.setTimeout(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (search.trim()) params.set('q', search.trim())
        if (category !== ALL_FILTER) params.set('category', category)
        params.set('sort', apiSort)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const res = await fetch(`/api/members/search?${params.toString()}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`status=${res.status}`)
        const json = (await res.json()) as Partial<SearchResponse>
        // 방어적 파싱: 서버 응답이 malformed여도 크래시하지 않도록 기본값 적용.
        setMembers(Array.isArray(json.members) ? json.members : [])
        setTotal(typeof json.total === 'number' ? json.total : 0)
        setTotalPages(typeof json.totalPages === 'number' && json.totalPages > 0 ? json.totalPages : 1)
      } catch (err) {
        if ((err as { name?: string } | null)?.name === 'AbortError') return
        logger.warn(
          { event: 'directory.v2.search_failed', err: String(err) },
          'directory v2 search failed',
        )
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      ctrl.abort()
      window.clearTimeout(handle)
    }
  }, [search, category, apiSort, page, pageSize, isAuthenticated, initialTotal])

  const visibleIds = React.useMemo(
    () => members.map((m) => m.id),
    [members],
  )
  React.useEffect(() => {
    persistDirectoryIds(visibleIds)
  }, [visibleIds])

  const isFiltering =
    search.trim().length > 0 || category !== ALL_FILTER
  const showEmpty = !loading && members.length === 0

  const handleReset = React.useCallback(() => {
    setSearch('')
    setCategory(ALL_FILTER)
    setPage(1)
  }, [])

  const useVirtual = React.useMemo(() => {
    if (virtualize === 'on') return true
    if (virtualize === 'off') return false
    return members.length >= VIRTUALIZE_THRESHOLD
  }, [virtualize, members.length])

  return (
    <DirectoryListProvider ids={visibleIds}>
      <div data-testid="directory-v2-page" className="flex w-full flex-col">
        {isAuthenticated && (
          <DirectoryCommandMenu
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            onLogout={onLogout}
          />
        )}

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <DirectoryHero
            isAuthenticated={isAuthenticated}
            totalCount={total}
            onGithubLogin={onGithubLogin}
            onGoogleLogin={onGoogleLogin}
          />
        </div>

        {isAuthenticated && (
          <div
            className={cn(
              'sticky top-0 z-sticky border-b border-[var(--color-border-subtle)]',
              'bg-[var(--color-bg-surface)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-surface)]/75',
            )}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <DirectorySearchBar value={search} onChange={setSearch} />
              <DirectoryFilters
                categories={chipCategories}
                category={category}
                onCategoryChange={setCategory}
                sort={sort}
                onSortChange={setSort}
              />
            </div>
          </div>
        )}

        {isAuthenticated && (
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div
              data-testid="directory-v2-result-count"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mb-4 text-sm text-[var(--color-text-muted)]"
            >
              {loading ? t('loading') : t('resultCount', { count: total })}
            </div>

            {loading ? (
              <DirectoryGridSkeleton />
            ) : showEmpty ? (
              <DirectoryEmptyState
                onReset={isFiltering ? handleReset : () => undefined}
                {...(!isFiltering
                  ? {
                      title: t('emptyTitle'),
                      description: t('emptyDescription'),
                      resetLabel: t('emptyResetLabel'),
                    }
                  : {})}
              />
            ) : useVirtual ? (
              <DirectoryVirtualGrid members={members} />
            ) : (
              <DirectoryGrid>
                {members.map((member) => (
                  <MemberCardV2 key={member.id} member={member} />
                ))}
              </DirectoryGrid>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  aria-label={t('pagination')}
                  data-testid="directory-v2-pagination"
                >
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        data-testid="directory-v2-pagination-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label={t('prevPage')}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive aria-label={t('currentPage', { page })}>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        data-testid="directory-v2-pagination-next"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        aria-label={t('nextPage')}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        )}
      </div>
    </DirectoryListProvider>
  )
}
