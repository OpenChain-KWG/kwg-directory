import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import ProfileFormV2 from '@/components/ProfileFormV2'
import AccountDataSection from '@/components/AccountDataSection'
import { Member } from '@/types/member'

export default async function ProfileEditPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  let member: Member | null = null
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    member = data as Member | null
  } catch {
    // Supabase 미연결 시 무시
  }

  if (!member) redirect('/profile/new')

  const t = await getTranslations('profileForm')

  return (
    <div className="animate-page-enter mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1
          data-testid="profile-form-heading"
          className="mb-2 text-3xl font-bold text-[var(--color-text)]"
        >
          {t('editTitle')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('editSubtitle')}</p>
      </div>
      <ProfileFormV2
        userId={session.user.id!}
        mode="edit"
        initialData={member}
      />
      <AccountDataSection />
    </div>
  )
}
