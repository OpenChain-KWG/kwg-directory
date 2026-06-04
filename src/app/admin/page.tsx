import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import AdminTabs from '@/components/AdminTabs'
import CsvDownloadButton from '@/components/CsvDownloadButton'
import MailingListStatus from '@/components/MailingListStatus'
import { Member } from '@/types/member'
import type { AdminInfo } from '@/components/AdminManagement'

async function getPendingMembers(): Promise<Member[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('approved', false)
      .is('rejection_reason', null)
      .order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []) as Member[]
  } catch {
    return []
  }
}

async function getAdmins(): Promise<AdminInfo[]> {
  try {
    const supabase = createAdminClient()
    const { data: admins, error } = await supabase
      .from('admins')
      .select('user_id, added_at')
      .order('added_at', { ascending: true })
    if (error || !admins || admins.length === 0) return []

    const userIds = admins.map((a) => a.user_id)
    const { data: members } = await supabase
      .from('members')
      .select('user_id, name_ko, avatar_url')
      .in('user_id', userIds)

    const memberMap = new Map((members ?? []).map((m) => [m.user_id, m]))

    return admins.map((admin) => {
      const member = memberMap.get(admin.user_id)
      return {
        user_id: admin.user_id,
        added_at: admin.added_at,
        name_ko: member?.name_ko ?? null,
        avatar_url: member?.avatar_url ?? null,
      }
    })
  } catch {
    return []
  }
}

async function getApprovedMembers(): Promise<Pick<Member, 'user_id' | 'name_ko' | 'company' | 'avatar_url'>[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select('user_id, name_ko, company, avatar_url')
      .eq('approved', true)
      .order('name_ko', { ascending: true })
    if (error) return []
    return (data ?? []) as Pick<Member, 'user_id' | 'name_ko' | 'company' | 'avatar_url'>[]
  } catch {
    return []
  }
}

type FailedInvite = Pick<Member, 'id' | 'name_ko' | 'company' | 'contact_email' | 'email' | 'mailing_invite_error'>

async function getFailedInvites(): Promise<FailedInvite[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select('id, name_ko, company, contact_email, email, mailing_invite_error')
      .eq('approved', true)
      .eq('subscribe_mailing_list', true)
      .not('mailing_invite_error', 'is', null)
      .order('updated_at', { ascending: false })
    if (error) return []
    return (data ?? []) as FailedInvite[]
  } catch {
    return []
  }
}

async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  const t = await getTranslations('admin')

  const adminUser = await isAdminWithMfa(session.user.id, session.user.mfaEnabled).catch(() => false)
  if (!adminUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">🔒</p>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">{t('accessDenied.title')}</h1>
        <p className="text-[var(--color-text-muted)]">{t('accessDenied.description')}</p>
      </div>
    )
  }

  const [pending, admins, approvedMembers, unreadCount, failedInvites] = await Promise.all([
    getPendingMembers(),
    getAdmins(),
    getApprovedMembers(),
    getUnreadNotificationsCount(),
    getFailedInvites(),
  ])

  return (
    <div className="animate-page-enter max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-[var(--color-text)] mb-2"
          >
            {t('pageTitle')}
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {t('pageSubtitle')}
          </p>
        </div>
        <CsvDownloadButton />
      </div>
      <AdminTabs
        initialPending={pending}
        initialAdmins={admins}
        approvedMembers={approvedMembers}
        currentUserId={session.user.id!}
        initialUnreadCount={unreadCount}
      />
      <MailingListStatus initialFailed={failedInvites} />
    </div>
  )
}
