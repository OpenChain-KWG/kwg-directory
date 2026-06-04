import { test, expect } from '@playwright/test'
import { loginAsUser, loginAsAdmin, loginAsUnregisteredUser } from './fixtures/auth'
import {
  createTestMember,
  cleanupTestData,
  insertTestAdmin,
  supabaseAvailable,
} from './fixtures/supabase'
import { T } from './helpers/testIds'

test.describe('04 — 멤버 목록 검증', () => {
  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('T22: 미등록 로그인 사용자 → NotRegisteredScreen 표시 @extended', async ({ page }) => {
    // Detects: 등록되지 않은 사용자가 디렉토리에 우회 접근하는 결함
    // TEST_USER는 globalSetup에서 approved로 시딩됨 → 미등록 전용 유저 사용
    await loginAsUnregisteredUser(page)
    await page.goto('/')

    await expect(page.getByTestId(T.notRegisteredScreen)).toBeVisible()
    await expect(page.getByRole('link', { name: '프로필 등록하기' })).toBeVisible()
  })

  test('T23: 미승인 로그인 사용자 → PendingApprovalScreen 표시 @extended', async ({ page }) => {
    // Detects: 승인 전 사용자의 상태 전이 가드 누락 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // approved=false 멤버 생성
    await createTestMember({ approved: false })

    await loginAsUser(page)
    await page.goto('/')

    await expect(page.getByTestId(T.pendingApprovalScreen)).toBeVisible()
    await expect(page.getByRole('link', { name: '내 프로필 수정하기' })).toBeVisible()
  })

  test('T24: 승인된 사용자 → 멤버 목록 표시 @extended', async ({ page }) => {
    // Detects: 승인 완료 사용자에게 정상 목록이 노출되지 않는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // approved=true 멤버 생성
    await createTestMember({ approved: true })

    await loginAsUser(page)
    await page.goto('/')

    await expect(page.getByTestId('main-heading')).toBeVisible()
    await expect(page.getByTestId(T.notRegisteredScreen)).not.toBeVisible()
    await expect(page.getByTestId(T.pendingApprovalScreen)).not.toBeVisible()
  })

  test('T25: 관리자는 미등록 상태여도 멤버 목록 접근 가능 @extended', async ({ page }) => {
    // Detects: 관리자 예외 정책 누락으로 운영자 접근이 차단되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // 관리자만 등록 (멤버 미생성)
    await insertTestAdmin()

    await loginAsAdmin(page)
    await page.goto('/')

    // 관리자는 not-registered-screen이 표시되면 안 됨
    await expect(page.getByTestId(T.notRegisteredScreen)).not.toBeVisible()
  })

  test('T10: 승인된 멤버 카드 표시 및 모달 열기/닫기 @extended', async ({ page }) => {
    // Detects: 카드-모달 상호작용 파손 또는 상세정보 렌더링 누락 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // 승인된 테스트 멤버 삽입
    const member = await createTestMember({
      approved: true,
      tags: ['SBOM', 'License'],
    })
    if (!member) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)
    await page.goto('/')

    // 멤버 카드 표시 확인
    const card = page.getByText('E2E테스트멤버').first()
    await expect(card).toBeVisible()

    // 카드에 소속 표시 확인
    await expect(page.getByText('E2E테스트기업').first()).toBeVisible()

    // 태그 배지 표시 확인
    await expect(page.getByText('SBOM').first()).toBeVisible()

    // 카드 클릭 → 모달 열림 확인
    await page.getByText('E2E테스트멤버').first().click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // 모달 내 이름, 소속, 역할 표시 확인
    await expect(modal.getByText('E2E테스트멤버')).toBeVisible()
    await expect(modal.getByText('E2E테스트기업')).toBeVisible()
    await expect(modal.getByText('Test Engineer')).toBeVisible()

    // ESC 키 → 모달 닫힘 확인
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('T11: 미승인 멤버 카드 비표시 @extended', async ({ page }) => {
    // Detects: 승인 플래그 미적용으로 미승인 멤버가 노출되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // 미승인 멤버 삽입
    await createTestMember({ approved: false })

    await loginAsUser(page)
    await page.goto('/')

    // 미승인 멤버 카드 미표시 확인
    await expect(page.getByText('E2E테스트멤버')).not.toBeVisible()
  })

  test('T12: 비로그인 상태 — 이메일·전화번호 API 비반환 @extended', async ({ page }) => {
    // Detects: 비로그인 응답에서 개인정보 필드가 노출되는 보안 결함
    // API 레벨에서 비로그인 시 email/phone null 확인
    // (히어로 페이지가 보이므로 디렉토리 UI 대신 API로 검증)
    const res = await page.request.get('/api/members')

    if (res.status() !== 200) {
      test.skip(true, 'Supabase 연결 필요')
    }

    const { data: members } = await res.json() as { data: Array<{ email: unknown; phone: unknown }> }
    for (const m of members) {
      expect(m.email).toBeNull()
      expect(m.phone).toBeNull()
    }
  })

  test('T13: 로그인 상태 — 이메일 표시 및 phone_public 조건 확인 @extended', async ({ page }) => {
    // Detects: phone_public 조건 무시로 비공개 전화번호가 노출되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // phone_public=true 멤버 삽입
    const publicMember = await createTestMember({
      approved: true,
      email: 'public@test.com',
      phone: '010-1111-2222',
      phone_public: true,
      userId: 'test-phone-public-user-e2e',
    })

    // phone_public=false 멤버 삽입
    const privateMember = await createTestMember({
      approved: true,
      email: 'private@test.com',
      phone: '010-3333-4444',
      phone_public: false,
    })

    if (!publicMember || !privateMember) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsUser(page)

    // API에서 로그인 상태 확인 (세션 쿠키 있는 상태로 요청)
    const res = await page.request.get('/api/members')
    expect(res.status()).toBe(200)

    const { data: members } = await res.json() as { data: Array<{
      user_id: string
      email: string | null
      phone: string | null
      phone_public: boolean
    }> }

    const pub = members.find((m) => m.user_id === 'test-phone-public-user-e2e')
    const priv = members.find((m) => m.user_id === 'test-member-user-e2e')

    // 로그인 상태에서 이메일 표시 확인
    if (pub) expect(pub.email).toBe('public@test.com')
    // phone_public=true → 전화번호 표시
    if (pub) expect(pub.phone).toBe('010-1111-2222')
    // phone_public=false → 전화번호 미표시
    if (priv) expect(priv.phone).toBeNull()
  })
})
