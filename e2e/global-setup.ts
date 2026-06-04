import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { insertTestAdmin } from './fixtures/supabase'
import { TEST_USER } from './fixtures/auth'

export default async function globalSetup() {
  // 테스트 어드민 계정 Supabase에 삽입
  await insertTestAdmin()

  // T02 등 기본 로그인 테스트용 — TEST_USER를 approved 멤버로 upsert
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key && !(url.includes('localhost:54321') && key.startsWith('test-'))) {
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase.from('members').upsert(
      {
        user_id: TEST_USER.id,
        name_ko: 'E2E테스트멤버',
        name_en: 'E2E Test Member',
        company: 'E2E테스트기업',
        role: 'Test Engineer',
        category: '기업',
        email: 'e2e-member@test.com',
        email_public: false,
        approved: true,
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      console.error('[globalSetup] 테스트 멤버 upsert 실패:', error.message)
    } else {
      console.log('[globalSetup] 테스트 멤버 approved로 등록 완료')
    }
  } else {
    console.warn('[globalSetup] Supabase 환경변수 없음, 멤버 시딩 생략')
  }

  // workers 스폰 전 서비스 키 제거 (worker process에 노출 방지) → Supabase 의존 테스트 자동 skip.
  // L2(실 DB E2E): E2E_SUPABASE=1 이면 키를 유지해 워커에서 Supabase 의존 테스트를 실제로 실행.
  // (비-prod Supabase 전용. globalTeardown이 시드 정리)
  if (process.env.E2E_SUPABASE !== '1') {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  } else {
    console.log('[globalSetup] E2E_SUPABASE=1 — Supabase 의존 테스트 활성화 (실 DB)')
  }

  // e2e/fixtures/test-avatar.jpg 생성 (1×1 픽셀 JPEG)
  const fixturesDir = join(__dirname, 'fixtures')
  const avatarPath = join(fixturesDir, 'test-avatar.jpg')

  if (!existsSync(avatarPath)) {
    if (!existsSync(fixturesDir)) {
      mkdirSync(fixturesDir, { recursive: true })
    }
    // 최소 JPEG (1×1 픽셀, 흰색)
    const jpegBytes = Buffer.from(
      'FFD8FFE000104A46494600010100000100010000' +
      'FFDB00430001010101010101010101010101010101010101010101010101' +
      '010101010101010101010101010101010101010101010101010101010101' +
      '01010101010101010101FFC0000B080001000101011100FFC4001F000001' +
      '0501010101010100000000000000000102030405060708090A0BFFC400B5' +
      '10000200030101010101010101000000000000000102030405060708090A' +
      '0BFFDA0008010100000105F6AFFD9',
      'hex'
    )
    writeFileSync(avatarPath, jpegBytes)
  }
}
