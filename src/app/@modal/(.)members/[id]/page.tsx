import { notFound } from 'next/navigation'

import { auth } from '@/auth'
import { MemberDetailSheet } from '@/components/directory'
import { createAdminClient } from '@/lib/supabase-admin'
import { captureApiError } from '@/lib/logger'
import { redactMemberContact } from '@/lib/member-privacy'
import type { Member } from '@/types/member'

type Params = Promise<{ id: string }>

/**
 * Intercepting route — `(.)` matches a same-level segment, so clicking a
 * card on `/` opens the sheet here while the URL becomes `/members/[id]`.
 * Hard navigation falls back to `app/members/[id]/page.tsx`.
 *
 * Conventions: see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md
 */
export default async function InterceptedMemberSheet({
  params,
}: {
  params: Params
}) {
  const session = await auth()
  if (!session?.user) notFound()

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
    captureApiError('GET @modal/(.)members/[id]', err)
    return null
  }
}
