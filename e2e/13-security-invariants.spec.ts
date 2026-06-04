import { test, expect } from '@playwright/test'
import { loginAsUser } from './fixtures/auth'
import {
  createTestMember,
  cleanupTestData,
  supabaseAvailable,
} from './fixtures/supabase'

/**
 * 13 — 보안 불변식 (@gate)
 *
 * 외부 제3자 QA(qa-automation) 보안·프라이버시 스펙을 우리 e2e로 흡수해
 * 회귀를 영구 방어한다 (QA HANDOVER §5: search-injection·email-privacy 1순위).
 *
 * - 검색 필터 인젝션(BUG-003, 수정 완료): PostgREST `.or()` 필터 주입 차단
 * - 이메일/전화 프라이버시 불변식: email_public/phone_public=false는 어떤 표면에서도 비노출
 *
 * 검증 계층:
 *   - 단위/통합(members-search.test.ts 등)에서 `.or()` 인용 형식을 매 PR 게이트 → 1차 방어.
 *   - 본 스펙은 실 PostgREST 대상 end-to-end 2차 방어.
 * 시딩 모델: 워커 시드는 E2E_SUPABASE=1(실 DB)에서만 동작 → 시드 의존 테스트는 그 외엔 skip
 *   (기존 @extended 시드 테스트와 동일 아키텍처). SEC-01은 시드 불필요 → 게이트에서 상시 실행.
 * API 레벨(page.request) 검증이라 testId/DOM에 의존하지 않는다.
 */

type SearchResp = {
  members: Array<{ user_id: string; name_ko: string; email: string | null }>
}

// SEC 테스트는 고정 userId(test-sec-*)로 멤버를 생성/정리한다. 파일 내 병렬 실행 시
// 동일 userId(예: SEC-03·SEC-04의 test-sec-public-e2e)가 충돌하므로 직렬 실행한다.
test.describe.configure({ mode: 'serial' })

// SEC 전용 네임스페이스. afterEach는 이 id만 스코프 정리하고, 다른 스펙의 전역 정리는
// test-sec-* 를 건드리지 않으므로(fixtures/supabase.ts) 교차 race가 없다.
const SEC_USER_IDS = [
  'test-sec-injection-e2e',
  'test-sec-public-e2e',
  'test-sec-private-e2e',
  'test-sec-detail-e2e',
  'test-sec-unapproved-e2e',
]

test.describe('13 — 검색 필터 인젝션 (BUG-003) @gate', () => {
  test.afterEach(async () => {
    await cleanupTestData({ userIds: SEC_USER_IDS })
  })

  test('SEC-01: 콤마 포함 검색이 5xx를 유발하지 않는다 (graceful) @gate', async ({
    page,
  }) => {
    // 콤마는 PostgREST `.or()` 구분자 → 미이스케이프 시 "failed to parse logic tree" 500.
    // 검색 API가 동작하는 환경에서만 의미가 있으므로 baseline으로 infra 가용성 확인 후 단언.
    const baseline = await page.request.get('/api/members/search?q=test')
    test.skip(baseline.status() >= 500, '검색 API(Supabase) 비가용 — infra skip')

    const res = await page.request.get(
      `/api/members/search?q=${encodeURIComponent('삼성,LG')}`,
    )
    expect(res.status(), '콤마 검색도 5xx 없이 처리되어야 함').toBeLessThan(500)
  })

  test('SEC-02: q로 비공개 컬럼 필터를 주입해 멤버를 추론할 수 없다 (PII 열거 차단) @gate', async ({
    page,
  }) => {
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const secretLocal = 'zzsecret-injection-probe'
    const member = await createTestMember({
      approved: true,
      email: `${secretLocal}@test.com`,
      email_public: false,
      userId: 'test-sec-injection-e2e',
    })
    if (!member) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)

    // 'zzznomatch'는 어떤 name_ko/name_en/company와도 안 맞음.
    // 인젝션이 무력화되면 주입한 email 필터가 리터럴로 갇혀 비공개 멤버가 노출되지 않아야 한다.
    const inj = `zzznomatch,email.ilike.%${secretLocal}%`
    const res = await page.request.get(
      `/api/members/search?q=${encodeURIComponent(inj)}`,
    )
    expect(res.status()).toBe(200)
    const json = (await res.json()) as SearchResp
    const userIds = json.members.map((m) => m.user_id)
    expect(
      userIds,
      '주입 필터가 무력화되어 비공개 멤버를 추론할 수 없어야 함',
    ).not.toContain('test-sec-injection-e2e')
  })
})

test.describe('13 — 이메일/전화 프라이버시 불변식 @gate', () => {
  test.afterEach(async () => {
    await cleanupTestData({ userIds: SEC_USER_IDS })
  })

  test('SEC-03: 검색 API — 로그인 멤버에게 email_public=true만 이메일 노출 @gate', async ({
    page,
  }) => {
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const pub = await createTestMember({
      approved: true,
      email: 'pub-sec@test.com',
      email_public: true,
      userId: 'test-sec-public-e2e',
    })
    const priv = await createTestMember({
      approved: true,
      email: 'priv-sec@test.com',
      email_public: false,
      userId: 'test-sec-private-e2e',
    })
    if (!pub || !priv) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)
    const res = await page.request.get(
      `/api/members/search?q=${encodeURIComponent('E2E테스트멤버')}`,
    )
    expect(res.status()).toBe(200)
    const json = (await res.json()) as SearchResp
    const pubM = json.members.find((m) => m.user_id === 'test-sec-public-e2e')
    const privM = json.members.find((m) => m.user_id === 'test-sec-private-e2e')
    expect(pubM?.email, 'email_public=true → 이메일 노출').toBe('pub-sec@test.com')
    expect(privM?.email, 'email_public=false → null').toBeNull()
  })

  test('SEC-04: 비로그인 검색 — 공개 멤버라도 이메일 비노출 @gate', async ({
    page,
  }) => {
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const pub = await createTestMember({
      approved: true,
      email: 'pub-sec@test.com',
      email_public: true,
      userId: 'test-sec-public-e2e',
    })
    if (!pub) test.skip(true, '테스트 멤버 생성 실패')

    // 로그인하지 않은 상태로 요청
    const res = await page.request.get(
      `/api/members/search?q=${encodeURIComponent('E2E테스트멤버')}`,
    )
    expect(res.status()).toBe(200)
    const json = (await res.json()) as SearchResp
    const m = json.members.find((x) => x.user_id === 'test-sec-public-e2e')
    expect(m, '공개 멤버는 비로그인 목록에도 보임').toBeTruthy()
    expect(m?.email, '비로그인에는 email_public=true라도 이메일 비노출').toBeNull()
  })

  test('SEC-05: 상세 조회 — email_public/phone_public=false 연락처 비노출 @gate', async ({
    page,
  }) => {
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const m = await createTestMember({
      approved: true,
      email: 'detail-priv@test.com',
      email_public: false,
      phone: '010-9999-0000',
      phone_public: false,
      userId: 'test-sec-detail-e2e',
    })
    if (!m) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)
    const res = await page.request.get(`/api/members/${m.id}`)
    expect(res.status()).toBe(200)
    const body = (await res.json()) as { email: string | null; phone: string | null }
    expect(body.email, 'email_public=false → null').toBeNull()
    expect(body.phone, 'phone_public=false → null').toBeNull()
  })

  test('SEC-06: 미승인 멤버 상세는 404 @gate', async ({ page }) => {
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const m = await createTestMember({
      approved: false,
      userId: 'test-sec-unapproved-e2e',
    })
    if (!m) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)
    const res = await page.request.get(`/api/members/${m.id}`)
    expect(res.status(), '미승인 멤버 상세 → 404').toBe(404)
  })
})
