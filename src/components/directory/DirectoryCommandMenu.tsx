'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, Moon, Settings, Shield, ShieldCheck, User } from 'lucide-react'

import {
  CommandMenu,
  CommandMenuEmpty,
  CommandMenuGroup,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  CommandMenuSeparator,
  CommandMenuShortcut,
} from '@/components/patterns'
import { logger } from '@/lib/logger'
import type { Member } from '@/types/member'

export interface DirectoryCommandMenuProps {
  /** Whether the viewer is logged in (drives quick action set). */
  isAuthenticated: boolean
  /** Whether the viewer is an admin (shows admin shortcut). */
  isAdmin?: boolean
  /** Optional logout server action. */
  onLogout?: () => void | Promise<void>
  /** Optional theme toggle handler. Wired by Phase 4 theme switcher. */
  onToggleTheme?: () => void
  /** Inject open-state externally (for storybook/tests). */
  initialOpen?: boolean
}

interface SearchResult {
  id: string
  name_ko: string
  company: string
  role?: string
}

const DEBOUNCE_MS = 200

/**
 * DirectoryCommandMenu — Cmd+K (Ctrl+K on non-Mac) palette for the directory.
 *
 * Quick actions (always available when authenticated):
 *   - 프로필 편집 → /profile/edit
 *   - 어드민 페이지 → /admin (admins only)
 *   - 테마 토글
 *   - 로그아웃
 *
 * Page navigation:
 *   - About, Privacy
 *
 * Member search:
 *   - Debounced 200ms hits `/api/members/search?q=…&pageSize=8`. Result group
 *     navigates to `/members/[id]` on select.
 *
 * The keyboard listener is registered on `window.keydown` and cleaned up on
 * unmount to keep memory leak free on flag flips.
 */
export function DirectoryCommandMenu({
  isAuthenticated,
  isAdmin = false,
  onLogout,
  onToggleTheme,
  initialOpen = false,
}: DirectoryCommandMenuProps) {
  const t = useTranslations('directoryCommand')
  const router = useRouter()
  const [open, setOpen] = React.useState(initialOpen)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)

  // Cmd+K / Ctrl+K to toggle.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const k = event.key.toLowerCase()
      if (k === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Debounced search.
  React.useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const ctrl = new AbortController()
    const handle = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, pageSize: '8' })
        const res = await fetch(`/api/members/search?${params.toString()}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) throw new Error(`status=${res.status}`)
        const json = (await res.json()) as { members?: Member[] }
        const incoming = json.members ?? []
        setResults(
          incoming.map((m) => ({
            id: m.id,
            name_ko: m.name_ko,
            company: m.company,
            role: m.role,
          })),
        )
      } catch (err) {
        if ((err as { name?: string } | null)?.name === 'AbortError') return
        logger.warn(
          { event: 'directory.command_menu.search_failed', err: String(err) },
          'command menu search failed',
        )
        setResults([])
      } finally {
        setSearching(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      ctrl.abort()
      window.clearTimeout(handle)
    }
  }, [query, open])

  const navigate = React.useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const handleLogout = React.useCallback(async () => {
    setOpen(false)
    if (onLogout) await onLogout()
  }, [onLogout])

  const handleTheme = React.useCallback(() => {
    setOpen(false)
    onToggleTheme?.()
  }, [onToggleTheme])

  const shortcutLabel = isMac() ? '⌘K' : 'Ctrl+K'

  return (
    <CommandMenu
      open={open}
      onOpenChange={setOpen}
      data-testid="directory-command-menu"
      dialogTitle={t('dialogTitle')}
      dialogDescription={t('dialogDescription', { shortcut: shortcutLabel })}
    >
      <CommandMenuInput
        data-testid="directory-command-menu-input"
        placeholder={t('inputPlaceholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandMenuList data-testid="directory-command-menu-list">
        <CommandMenuEmpty>
          {searching ? t('searching') : t('empty')}
        </CommandMenuEmpty>

        {results.length > 0 && (
          <CommandMenuGroup heading={t('membersHeading')}>
            {results.map((member) => (
              <CommandMenuItem
                key={member.id}
                data-testid="directory-command-menu-result"
                value={`member:${member.id}:${member.name_ko}:${member.company}`}
                onSelect={() => navigate(`/members/${member.id}`)}
              >
                <User aria-hidden />
                <span className="flex-1 truncate">{member.name_ko}</span>
                <span className="ml-2 truncate text-xs text-[var(--color-text-muted)]">
                  {member.company}
                </span>
              </CommandMenuItem>
            ))}
          </CommandMenuGroup>
        )}

        {results.length > 0 && <CommandMenuSeparator />}

        {isAuthenticated && (
          <CommandMenuGroup heading={t('quickActionsHeading')}>
            <CommandMenuItem
              data-testid="directory-command-menu-edit-profile"
              onSelect={() => navigate('/profile/edit')}
            >
              <Settings aria-hidden />
              {t('editProfile')}
            </CommandMenuItem>
            {isAdmin && (
              <CommandMenuItem
                data-testid="directory-command-menu-admin"
                onSelect={() => navigate('/admin')}
              >
                <ShieldCheck aria-hidden />
                {t('adminPage')}
              </CommandMenuItem>
            )}
            {onToggleTheme && (
              <CommandMenuItem
                data-testid="directory-command-menu-theme"
                onSelect={handleTheme}
              >
                <Moon aria-hidden />
                {t('toggleTheme')}
              </CommandMenuItem>
            )}
            {onLogout && (
              <CommandMenuItem
                data-testid="directory-command-menu-logout"
                onSelect={handleLogout}
              >
                <LogOut aria-hidden />
                {t('logout')}
              </CommandMenuItem>
            )}
          </CommandMenuGroup>
        )}

        <CommandMenuSeparator />

        <CommandMenuGroup heading={t('pagesHeading')}>
          <CommandMenuItem
            data-testid="directory-command-menu-privacy"
            onSelect={() => navigate('/privacy')}
          >
            <Shield aria-hidden />
            {t('privacy')}
            <CommandMenuShortcut>{shortcutLabel}</CommandMenuShortcut>
          </CommandMenuItem>
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  )
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}
