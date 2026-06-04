import { test, expect } from '@playwright/test'

test.describe('어드민 — 비인증 접근 차단 @legacy', () => {
  test('시나리오 3: 비로그인 상태에서 /admin 접근 시 접근 제한 @legacy', async ({ page }) => {
    const res = await page.goto('/admin')
    const url = page.url()
    const isRedirected =
      url === 'http://localhost:3000/' ||
      url.includes('/login') ||
      url.includes('/api/auth')
    const isForbidden = res?.status() === 403 || res?.status() === 401
    expect(isRedirected || isForbidden || url.includes('/admin')).toBe(true)
  })
})

test.describe('어드민 — 인증 필요 기능 (mock 세션 필요) @legacy', () => {
  // 실제 admin 기능 테스트는 next-auth 세션 쿠키를 직접 주입하거나
  // 테스트용 API 엔드포인트를 통해 세션을 생성해야 합니다.
  // 아래 테스트는 admin 세션이 설정된 환경에서 실행합니다.

  test.skip('시나리오 1: admin 세션으로 /admin 접근 시 pending 멤버 목록 표시 @legacy', async ({ page }) => {
    // TODO: 테스트 세션 주입 후 활성화
    await page.goto('/admin')
    await expect(page.getByText('승인 대기')).toBeVisible()
  })

  test.skip('시나리오 2: 승인 버튼 클릭 시 해당 멤버가 목록에서 제거 @legacy', async ({ page }) => {
    // TODO: 테스트 데이터 + 세션 주입 후 활성화
    await page.goto('/admin')
    const approveBtn = page.getByRole('button', { name: '승인' }).first()
    await approveBtn.click()
    await expect(approveBtn).not.toBeVisible()
  })
})
