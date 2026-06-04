'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Globe, Mail, MessageCircle, Phone } from 'lucide-react'

import { GithubMark, LinkedinMark } from '@/components/icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  IconButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui'
import { getInitials, cn } from '@/lib/utils'
import type { Member } from '@/types/member'

import {
  readPersistedDirectoryIds,
  useDirectoryList,
} from './DirectoryListContext'

export interface MemberDetailSheetProps {
  /** Member rendered in the sheet body. */
  member: Member
  /** When false, the sheet renders inert (used for SSR sanity). */
  open?: boolean
  /**
   * When true, render full-screen on mobile (recommended for detail content).
   * Desktop always uses a right-aligned Sheet; mobile flips to bottom sheet
   * full-height when this is on. Default true.
   */
  mobileFullScreen?: boolean
}

interface SnsLink {
  label: string
  href: string
  icon: React.ReactNode
}

function buildSnsLinks(member: Member, blogLabel: string): SnsLink[] {
  const links: SnsLink[] = []
  if (member.linkedin) {
    links.push({
      // 브랜드 식별자(i18n 제외)
      label: 'LinkedIn',
      href: member.linkedin,
      icon: <LinkedinMark className="h-4 w-4" />,
    })
  }
  if (member.github) {
    const handle = member.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')
    links.push({
      // 브랜드 식별자(i18n 제외)
      label: 'GitHub',
      href: handle.startsWith('http') ? handle : `https://github.com/${handle}`,
      icon: <GithubMark className="h-4 w-4" />,
    })
  }
  if (member.blog) {
    links.push({
      label: blogLabel,
      href: member.blog,
      icon: <Globe aria-hidden className="h-4 w-4" />,
    })
  }
  return links
}

/**
 * MemberDetailSheet — primary detail surface for `/members/[id]`.
 *
 * Used by both the intercepted modal route (`@modal/(.)members/[id]`) and the
 * standalone full-page route. Closing the sheet calls `router.back()` so the
 * directory scroll position is preserved.
 *
 * Keyboard navigation:
 *   - Esc      → close (Radix Dialog default)
 *   - ←/→      → prev / next member from `useDirectoryList`
 *
 * When the directory list context is absent (hard navigation), the prev/next
 * buttons fall back to sessionStorage. If both miss, the controls are
 * rendered disabled with an explanatory aria-label.
 */
export function MemberDetailSheet({
  member,
  open = true,
  mobileFullScreen = true,
}: MemberDetailSheetProps) {
  const t = useTranslations('memberDetail')
  const router = useRouter()

  const ctx = useDirectoryList()
  const [hydratedIds, setHydratedIds] = React.useState<readonly string[]>(() =>
    ctx?.ids ?? [],
  )
  React.useEffect(() => {
    if (ctx?.ids && ctx.ids.length > 0) {
      setHydratedIds(ctx.ids)
      return
    }
    const persisted = readPersistedDirectoryIds()
    if (persisted) setHydratedIds(persisted)
  }, [ctx])

  const idx = hydratedIds.indexOf(member.id)
  const prevId = idx > 0 ? hydratedIds[idx - 1] : null
  const nextId = idx >= 0 && idx < hydratedIds.length - 1 ? hydratedIds[idx + 1] : null

  const close = React.useCallback(() => {
    router.back()
  }, [router])

  const goTo = React.useCallback(
    (targetId: string | null) => {
      if (!targetId) return
      router.replace(`/members/${targetId}`)
    },
    [router],
  )

  // ←/→ keyboard navigation. Skip when focus sits on a form field so users can
  // still edit text inside the sheet.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const editable =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT'
      if (editable) return
      if (event.key === 'ArrowLeft' && prevId) {
        event.preventDefault()
        goTo(prevId)
      } else if (event.key === 'ArrowRight' && nextId) {
        event.preventDefault()
        goTo(nextId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [prevId, nextId, goTo])

  const initials = getInitials(member.name_ko)
  const sns = buildSnsLinks(member, t('blog'))

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <SheetContent
        side="right"
        data-testid="member-detail-sheet"
        aria-labelledby="member-detail-sheet-title"
        className={cn(
          'flex max-h-screen flex-col overflow-y-auto p-0 sm:max-w-md',
          mobileFullScreen
            ? 'inset-y-0 right-0 h-full w-full max-w-full sm:max-w-md'
            : '',
        )}
      >
        <header className="flex items-start gap-3 border-b border-[var(--color-border-subtle)] px-6 pb-4 pt-6">
          <Avatar className="h-16 w-16">
            {member.avatar_url ? (
              <AvatarImage
                src={member.avatar_url}
                alt={t('avatarAlt', { name: member.name_ko })}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-1">
            <SheetTitle
              id="member-detail-sheet-title"
              data-testid="member-detail-sheet-title"
              className="truncate"
            >
              {member.name_ko}
            </SheetTitle>
            {member.name_en && (
              <SheetDescription className="mt-0.5 truncate">
                {member.name_en}
              </SheetDescription>
            )}
            {member.role && (
              <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-link)]">
                {member.role}
              </p>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <dl className="divide-y divide-[var(--color-border-subtle)]">
            <DetailRow label={t('company')}>
              <span>{member.company}</span>
              {member.category && (
                <Badge variant="secondary" className="ml-2">
                  {member.category}
                </Badge>
              )}
            </DetailRow>

            {member.bio && (
              <DetailRow label={t('bio')}>
                <p className="text-sm leading-relaxed text-[var(--color-text-default)]">
                  {member.bio}
                </p>
              </DetailRow>
            )}

            {member.email ? (
              <DetailRow label={t('email')}>
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-link)] hover:underline"
                >
                  <Mail aria-hidden className="h-4 w-4" />
                  {member.email}
                </a>
              </DetailRow>
            ) : null}

            {member.phone && member.phone_public ? (
              <DetailRow label={t('phone')}>
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-link)] hover:underline"
                >
                  <Phone aria-hidden className="h-4 w-4" />
                  {member.phone}
                </a>
              </DetailRow>
            ) : null}

            {member.discord && (
              <DetailRow label={t('discord')}>
                <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-default)]">
                  <MessageCircle aria-hidden className="h-4 w-4" />
                  {member.discord}
                </span>
              </DetailRow>
            )}

            {sns.length > 0 && (
              <DetailRow label={t('links')}>
                <ul className="flex flex-col gap-1.5">
                  {sns.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-link)] hover:underline"
                        aria-label={t('openProfile', { label: link.label })}
                      >
                        {link.icon}
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </DetailRow>
            )}

            {member.tags && member.tags.length > 0 && (
              <DetailRow label={t('tags')}>
                <div className="flex flex-wrap gap-1.5">
                  {member.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DetailRow>
            )}
          </dl>
        </div>

        <footer
          data-testid="member-detail-sheet-nav"
          className={cn(
            'flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)]',
            'px-6 py-3',
          )}
        >
          <IconButton
            type="button"
            variant="ghost"
            size="icon-md"
            data-testid="member-detail-prev-btn"
            disabled={!prevId}
            onClick={() => goTo(prevId)}
            aria-label={t('prevMember')}
            aria-keyshortcuts="ArrowLeft"
          >
            <ChevronLeft aria-hidden />
          </IconButton>
          <p className="text-xs text-[var(--color-text-muted)]">
            <span aria-hidden>← →</span>
            <span className="ml-1.5">{t('keyHint')}</span>
          </p>
          <IconButton
            type="button"
            variant="ghost"
            size="icon-md"
            data-testid="member-detail-next-btn"
            disabled={!nextId}
            onClick={() => goTo(nextId)}
            aria-label={t('nextMember')}
            aria-keyshortcuts="ArrowRight"
          >
            <ChevronRight aria-hidden />
          </IconButton>
        </footer>
      </SheetContent>
    </Sheet>
  )
}

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--color-text-default)]">{children}</dd>
    </div>
  )
}
