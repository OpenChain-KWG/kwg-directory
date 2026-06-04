import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TEST_ADMIN, TEST_USER } from './auth'

// test-* user_id를 가진 모든 테스트 데이터의 공통 식별자
const TEST_MEMBER_USER_ID = 'test-member-user-e2e'

function getClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || url.includes('localhost:54321') && key.startsWith('test-')) {
    return null
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const supabaseAvailable = !!getClient()

export async function insertTestAdmin() {
  const supabase = getClient()
  if (!supabase) return

  // 이미 있으면 무시
  await supabase
    .from('admins')
    .upsert({ user_id: TEST_ADMIN.id }, { onConflict: 'user_id' })
}

export interface TestMemberOptions {
  approved?: boolean
  email?: string
  email_public?: boolean
  phone?: string
  phone_public?: boolean
  tags?: string[]
  userId?: string
}

export async function createTestMember(opts: TestMemberOptions = {}) {
  const supabase = getClient()
  if (!supabase) return null

  const userId = opts.userId ?? TEST_MEMBER_USER_ID

  const { data, error } = await supabase
    .from('members')
    .insert({
      user_id: userId,
      name_ko: 'E2E테스트멤버',
      name_en: 'E2E Test Member',
      company: 'E2E테스트기업',
      role: 'Test Engineer',
      category: '기업',
      email: opts.email ?? 'e2e-member@test.com',
      email_public: opts.email_public ?? false,
      phone: opts.phone ?? null,
      phone_public: opts.phone_public ?? false,
      tags: opts.tags ?? ['SBOM', 'License'],
      approved: opts.approved ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('[E2E] createTestMember error:', error.message)
    return null
  }
  return data as { id: string; user_id: string; name_ko: string; approved: boolean }
}

export async function approveTestMember(id: string) {
  const supabase = getClient()
  if (!supabase) return

  await supabase.from('members').update({ approved: true }).eq('id', id)
}

/**
 * 테스트 데이터 정리. 병렬 실행 격리 규칙:
 *  - 공유 시드(TEST_USER 멤버 / TEST_ADMIN)는 항상 보존 — 삭제 시 동시 실행 스펙이 collateral로 깨진다.
 *  - `opts.userIds` 지정 시 그 id만 삭제(스코프 정리) — 자기 스펙 데이터만 건드린다.
 *  - 무인자(전역) 정리는 `test-sec-*` 네임스페이스를 보존 — SEC 스펙이 자기 id를 스코프 정리하므로
 *    다른 스펙의 전역 정리가 SEC의 in-flight 멤버를 삭제하지 못하게 한다(교차 race 방지).
 */
export async function cleanupTestData(opts?: { userIds?: string[] }) {
  const supabase = getClient()
  if (!supabase) return

  const SEED = [TEST_USER.id, TEST_ADMIN.id]

  if (opts?.userIds) {
    const ids = opts.userIds.filter((id) => !SEED.includes(id))
    if (ids.length) await supabase.from('members').delete().in('user_id', ids)
    await supabase.from('notifications').delete().like('payload->>user_id', 'test-%')
    return
  }

  await supabase
    .from('members')
    .delete()
    .like('user_id', 'test-%')
    .neq('user_id', TEST_USER.id)
    .not('user_id', 'like', 'test-sec-%')

  await supabase
    .from('admins')
    .delete()
    .like('user_id', 'test-%')
    .neq('user_id', TEST_ADMIN.id)

  await supabase
    .from('notifications')
    .delete()
    .like('payload->>user_id', 'test-%')
}

export async function getMemberById(id: string) {
  const supabase = getClient()
  if (!supabase) return null

  const { data } = await supabase.from('members').select('*').eq('id', id).single()
  return data
}

export async function getMemberByUserId(userId: string) {
  const supabase = getClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}
