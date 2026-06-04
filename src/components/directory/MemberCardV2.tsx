'use client'

import * as React from 'react'
import Link from 'next/link'
import { Globe, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { GithubMark, LinkedinMark } from '@/components/icons'
import { Avatar, AvatarFallback, AvatarImage, Badge, Card } from '@/components/ui'
import { getInitials, cn } from '@/lib/utils'
import type { Member } from '@/types/member'

export interface MemberCardV2Props {
  member: Member
  className?: string
}

const SNS_ICON: Record<string, React.ReactNode> = {
  linkedin: <LinkedinMark className="h-3.5 w-3.5" />,
  github: <GithubMark className="h-3.5 w-3.5" />,
  discord: <MessageCircle aria-hidden className="h-3.5 w-3.5" />,
  blog: <Globe aria-hidden className="h-3.5 w-3.5" />,
}

// Brand names are proper nouns and stay untranslated; "blog" is localized inline.
const SNS_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  discord: 'Discord',
}

/**
 * MemberCardV2 — directory v2 card.
 *
 * - Wraps a `next/link` so the entire card is keyboard-navigable.
 * - Hover lifts and brand-tints the border.
 * - Avatar falls back to initials over the primary gradient (Avatar primitive).
 * - SNS chips render as inert decorations; deep-linking lives on the detail page (chunk 2).
 */
export function MemberCardV2({ member, className }: MemberCardV2Props) {
  const t = useTranslations('memberCard')
  const initials = getInitials(member.name_ko)
  const snsKeys = (
    [
      member.linkedin && 'linkedin',
      member.github && 'github',
      member.discord && 'discord',
      member.blog && 'blog',
    ].filter(Boolean) as string[]
  ).slice(0, 4)

  const tags = member.tags?.slice(0, 3) ?? []
  const remainingTags = (member.tags?.length ?? 0) - tags.length

  return (
    <Link
      href={`/members/${member.id}`}
      data-testid="directory-v2-card"
      data-member-id={member.id}
      aria-label={t('viewDetail', { name: member.name_ko })}
      className={cn(
        'group block rounded-lg',
        'transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none',
        'hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]',
        className,
      )}
    >
      <Card
        className={cn(
          'flex h-full flex-col gap-3 p-4',
          'border-[var(--color-border-subtle)]',
          'group-hover:border-[var(--color-border-focus)] group-hover:shadow-md',
          'transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            {member.avatar_url ? (
              <AvatarImage
                src={member.avatar_url}
                alt={t('avatarAlt', { name: member.name_ko })}
              />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-base font-semibold leading-tight text-[var(--color-text-default)] group-hover:text-[var(--color-text-link)]">
                {member.name_ko}
              </p>
              {member.name_en && (
                <span className="truncate text-xs text-[var(--color-text-muted)]">
                  {member.name_en}
                </span>
              )}
            </div>
            {member.role && (
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                {member.role}
              </p>
            )}
            <p className="mt-1 truncate text-sm text-[var(--color-text-default)]">
              {member.company}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {member.category && (
            <Badge variant="secondary">{member.category}</Badge>
          )}
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {remainingTags > 0 && (
            <Badge variant="outline" aria-hidden>
              +{remainingTags}
            </Badge>
          )}
        </div>

        {snsKeys.length > 0 && (
          <ul className="mt-auto flex items-center gap-1 pt-1">
            {snsKeys.map((key) => {
              const label = key === 'blog' ? t('snsBlog') : SNS_LABEL[key]
              return (
                <li
                  key={key}
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full',
                    'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-muted)]',
                  )}
                  aria-label={t('snsHas', { platform: label })}
                >
                  {SNS_ICON[key]}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Link>
  )
}
