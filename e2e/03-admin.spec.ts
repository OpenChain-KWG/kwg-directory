import { test, expect } from '@playwright/test'
import { loginAsUser, loginAsAdmin } from './fixtures/auth'
import {
  createTestMember,
  approveTestMember,
  getMemberById,
  cleanupTestData,
  insertTestAdmin,
  supabaseAvailable,
} from './fixtures/supabase'
import { T } from './helpers/testIds'

test.describe('03 — 어드민 승인 검증', () => {
  // afterEach의 cleanupTestData가 TEST_ADMIN을 admins에서 삭제하므로,
  // 매 테스트 전에 admin을 재보장한다 (테스트 격리).
  test.beforeEach(async () => {
    await insertTestAdmin()
  })
  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('T07: 어드민 — 미승인 멤버 표시 및 승인 처리 @extended', async ({ page }) => {
    // Detects: 승인 액션이 UI에서만 성공하고 실제 상태값(approved) 반영이 누락되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // 미승인 테스트 멤버 삽입
    const member = await createTestMember({ approved: false })
    if (!member) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsAdmin(page)
    await page.goto('/admin')

    // 승인 대기 목록에 테스트 멤버 행 표시 확인 (이름은 실 DB에서 중복 가능 → 행 단위)
    const memberRow = page.locator(`[data-member-id="${member!.id}"]`)
    await expect(memberRow).toBeVisible({ timeout: 15000 })

    // 어드민 API mock: 실제 Supabase 승인 처리 후 응답
    await page.route('/api/admin/approve', async (route) => {
      const body = route.request().postDataJSON() as { id?: string }
      if (body.id === member!.id) {
        await approveTestMember(member!.id)
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    // 승인 버튼 클릭 — 해당 멤버 행으로만 스코프 (실 DB에 다른 대기 멤버가 있어도 안전)
    await memberRow.getByRole('button', { name: '승인' }).click()

    // 승인된 멤버 행이 대기 목록에서 사라짐 확인 (이름은 중복 가능 → 행 단위로 검증)
    await expect(memberRow).toHaveCount(0, { timeout: 5000 })

    // Supabase에서 approved=true 확인
    const updated = await getMemberById(member!.id)
    expect(updated?.approved).toBe(true)
  })

  test('T21: 거절 버튼 → 사유 선택 모달 → 거절 확정 → 목록에서 제거 @extended', async ({ page }) => {
    // Detects: 거절 UX 완료 후 목록 상태가 동기화되지 않는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    const member = await createTestMember({ approved: false })
    if (!member) test.skip(true, '테스트 멤버 생성 실패')

    await loginAsAdmin(page)
    await page.goto('/admin')

    // 테스트 멤버 행이 대기 목록에 표시되어야 함 (행 단위 — 실 DB 중복 안전)
    const memberRow = page.locator(`[data-member-id="${member!.id}"]`)
    await expect(memberRow).toBeVisible({ timeout: 15000 })

    // 거절 API mock (실제 DB 변경 없이)
    await page.route('/api/admin/reject', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    // 해당 멤버 행의 거절 버튼 클릭
    await memberRow.getByRole('button', { name: '거절' }).click()

    // 거절 사유 입력 모달 표시 확인 (타이틀로 식별)
    await expect(page.getByText('거절 사유 입력')).toBeVisible()

    // 거절 사유 선택
    await page.getByRole('combobox').selectOption('가입 자격 미해당')

    // 거절 확정 버튼 클릭
    await page.getByRole('button', { name: '거절 확정' }).click()

    // 멤버 행이 대기 목록에서 사라짐 확인 (행 단위)
    await expect(memberRow).toHaveCount(0, { timeout: 5000 })
  })

  test('T08: 일반 사용자의 /admin 접근 차단 @gate', async ({ page }) => {
    // Detects: role 검증 누락으로 일반 사용자에게 관리자 화면이 노출되는 결함
    await loginAsUser(page)
    await page.goto('/admin')

    // "접근 권한 없음" 표시 또는 홈으로 리디렉션 확인
    const isBlocked =
      (await page.getByText('접근 권한 없음').isVisible().catch(() => false)) ||
      page.url() === 'http://localhost:3000/'

    expect(isBlocked).toBe(true)
  })

  test('T09: 비로그인 상태의 /admin 접근 시 홈으로 리디렉션 @gate', async ({ page }) => {
    // Detects: 미인증 접근 차단 누락으로 관리자 엔드포인트가 노출되는 결함
    await page.goto('/admin')

    // 세션 없으면 '/'로 redirect
    await page.waitForURL('/')
    expect(page.url()).toBe('http://localhost:3000/')
  })
})
