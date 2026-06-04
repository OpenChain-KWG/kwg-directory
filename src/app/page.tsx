import { getTranslations } from 'next-intl/server'
import { auth, signIn, signOut } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { redactMemberContact } from '@/lib/member-privacy'
import FlashMessage from '@/components/FlashMessage'
import PendingApprovalScreen from '@/components/PendingApprovalScreen'
import NotRegisteredScreen from '@/components/NotRegisteredScreen'
import { DirectoryV2Page } from '@/components/directory'
import { Member } from '@/types/member'

const INITIAL_PAGE_SIZE = 20

async function getInitialMembersData(isAuthenticated: boolean): Promise<{
  members: Member[]
  total: number
}> {
  try {
    const supabase = createAdminClient()

    const memberResult = await supabase
      .from('members')
      .select(
        'id, user_id, name_ko, name_en, company, role, bio, category, email, email_public, phone, phone_public, linkedin, github, discord, blog, avatar_url, tags, approved, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('approved', true)
      .order('name_ko', { ascending: true })
      .range(0, INITIAL_PAGE_SIZE - 1)

    const members = (memberResult.data ?? []).map((m) =>
      redactMemberContact(m, isAuthenticated)
    ) as Member[]

    return { members, total: memberResult.count ?? 0 }
  } catch {
    return { members: [], total: 0 }
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  const params = await searchParams
  const withdrawn = params.withdrawn === '1'
  const t = await getTranslations('homeGuest')

  // 게스트(로그아웃) — v2 디렉토리 단일 경로.
  if (!session) {
    // 집계 카운트만 노출(개별 멤버 데이터는 미노출) — 랜딩 신뢰 티저용.
    let guestTotal = 0
    try {
      const supabase = createAdminClient()
      const { count } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('approved', true)
      guestTotal = count ?? 0
    } catch {
      guestTotal = 0
    }
    return (
      <>
        {withdrawn && <FlashMessage message={t('withdrawnFlash')} />}
        <DirectoryV2Page
          initialMembers={[]}
          initialTotal={guestTotal}
          isAuthenticated={false}
          onGithubLogin={async () => {
            'use server'
            await signIn('github')
          }}
          onGoogleLogin={async () => {
            'use server'
            await signIn('google')
          }}
        />
      </>
    )
  }

  // 관리자 여부 및 멤버 상태 확인
  let memberData: { approved: boolean; name_ko: string; created_at: string } | null = null
  let adminUser = false
  let supabaseConnected = false
  try {
    const supabase = createAdminClient()
    const [{ data }, adminResult] = await Promise.all([
      supabase
        .from('members')
        .select('approved, name_ko, created_at')
        .eq('user_id', session.user.id)
        .maybeSingle(),
      isAdminWithMfa(session.user.id, session.user.mfaEnabled).catch(() => false),
    ])
    memberData = data ?? null
    adminUser = adminResult
    supabaseConnected = true
  } catch {
    // Supabase 미연결 시 — 접근 제어 우회, 빈 디렉토리 표시
  }

  // Supabase 연결 시에만 접근 제어 적용
  if (supabaseConnected) {
    // 미등록 사용자 (관리자 제외)
    if (!memberData && !adminUser) {
      return <NotRegisteredScreen />
    }

    // 승인 대기 중인 멤버 (관리자 제외)
    if (memberData && !memberData.approved && !adminUser) {
      return (
        <PendingApprovalScreen
          name={memberData.name_ko}
          createdAt={memberData.created_at}
        />
      )
    }
  }

  const { members, total } = await getInitialMembersData(true)

  return (
    <>
      <h1 className="sr-only" data-testid="main-heading">{t('srHeading')}</h1>
      <DirectoryV2Page
        initialMembers={members}
        initialTotal={total}
        isAuthenticated={true}
        isAdmin={adminUser}
        onLogout={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}
      />
    </>
  )
}
