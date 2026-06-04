import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import ProfileFormV2 from '@/components/ProfileFormV2'

export default async function ProfileNewPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  // 이미 프로필이 있으면 편집 페이지로
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (data) redirect('/profile/edit')
  } catch {
    // Supabase 미연결 시 무시
  }

  const t = await getTranslations('profileForm')

  return (
    <div className="animate-page-enter mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1
          data-testid="profile-form-heading"
          className="mb-2 text-3xl font-bold text-[var(--color-text)]"
        >
          {t('createTitle')}
        </h1>
        <p className="text-[var(--color-text-muted)]">{t('createSubtitle')}</p>
      </div>
      <ProfileFormV2
        userId={session.user.id!}
        mode="create"
        userImage={session.user.image ?? undefined}
      />
    </div>
  )
}
