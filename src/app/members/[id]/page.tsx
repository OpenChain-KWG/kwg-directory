import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { MemberDetailSheet } from '@/components/directory'
import { createAdminClient } from '@/lib/supabase-admin'
import { captureApiError } from '@/lib/logger'
import { redactMemberContact } from '@/lib/member-privacy'
import type { Member } from '@/types/member'

type Params = Promise<{ id: string }>

/**
 * Standalone member detail page.
 *
 * Reachable via:
 *   - hard navigation (refresh, shared URL) — renders this page directly
 *   - intercepting modal route (`@modal/(.)members/[id]`) — renders the sheet
 *     overlaying the directory while keeping URL in sync
 *
 * RLS-aware: only `approved` members are returned. Email is filtered to
 * `null` when the viewer is not authenticated; the underlying API enforces
 * this server-side.
 */
export default async function MemberDetailPage({ params }: { params: Params }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const { id } = await params
  const member = await fetchMember(id, Boolean(session))
  if (!member) notFound()

  return <MemberDetailSheet member={member} />
}

async function fetchMember(
  id: string,
  isAuthenticated: boolean,
): Promise<Member | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select(
        'id, user_id, name_ko, name_en, company, role, bio, category, email, email_public, phone, phone_public, linkedin, github, discord, blog, avatar_url, tags, approved, created_at, updated_at',
      )
      .eq('id', id)
      .eq('approved', true)
      .single()
    if (error || !data) return null
    return redactMemberContact(data, isAuthenticated) as Member
  } catch (err) {
    captureApiError('GET /members/[id] (page)', err)
    return null
  }
}
