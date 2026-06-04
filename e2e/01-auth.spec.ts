import { test, expect } from '@playwright/test'
import { loginAsUser } from './fixtures/auth'
import { supabaseAvailable } from './fixtures/supabase'
import { T } from './helpers/testIds'

test.describe('01 — 로그인 검증', () => {
  test('T01: GitHub 로그인 버튼 표시 및 OAuth 리디렉션 @gate', async ({ page }) => {
    // Detects: OAuth 진입선이 끊겨 사용자가 로그인 플로우를 시작하지 못하는 결함
    await page.goto('/')

    // 로그인 버튼 표시 확인 (히어로 + Navbar에 동일 버튼이 있으므로 first() 사용)
    const githubBtn = page.getByRole('button', { name: 'GitHub로 로그인' }).first()
    await expect(githubBtn).toBeVisible()

    // 클릭 시 OAuth URL 또는 auth 경로로 이동하는지 확인 (실제 로그인 없이 URL만 검증)
    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('github.com') ||
        res.url().includes('/api/auth') ||
        res.url().includes('api/auth/signin')
      ).catch(() => null) as Promise<unknown>,
      githubBtn.click(),
    ])

    // 리디렉션이 GitHub 또는 NextAuth 경로를 향하는지 확인
    const currentUrl = page.url()
    const isValidRedirect =
      currentUrl.includes('github.com') ||
      currentUrl.includes('/api/auth') ||
      !!response
    expect(isValidRedirect).toBe(true)
  })

  test('T02: 로그인 상태 UI 전환 @extended', async ({ page }) => {
    // Detects: 세션 인식 실패로 로그인 후 UI가 비로그인 상태로 남는 결함
    test.skip(!supabaseAvailable, 'Supabase 미연결 환경 — 테스트 멤버 시딩 불가')
    // 세션 mock 주입 후 페이지 접속
    await loginAsUser(page)
    await page.goto('/')

    // 멤버 주소록 페이지가 표시되어야 함 (로그인 상태)
    await expect(page.getByTestId(T.mainHeading)).toBeVisible()

    // Navbar에 "내 정보 등록" 링크 표시 확인
    await expect(page.getByTestId(T.registerProfileLink)).toBeVisible()

    // 로그인 버튼 미표시 확인
    await expect(page.getByRole('button', { name: 'GitHub로 로그인' })).not.toBeVisible()

    // 로그아웃 버튼 표시 확인
    await expect(page.getByTestId(T.logoutBtn)).toBeVisible()
  })

  test('T03: 로그아웃 후 세션 만료 및 로그인 버튼 재표시 @gate', async ({ page }) => {
    // Detects: 로그아웃 후 보호 상태가 유지되어 권한이 잔존하는 결함
    await loginAsUser(page)
    await page.goto('/')

    // 로그인 상태 확인
    await expect(page.getByTestId(T.logoutBtn)).toBeVisible()

    // 로그아웃 버튼 클릭
    await page.getByTestId(T.logoutBtn).click()

    // 로그아웃 후 UI로 세션 만료 확인 (JWT 쿠키는 즉시 삭제되지 않으므로 API 대신 UI 검증)
    await page.waitForURL('/')
    await expect(
      page.getByRole('button', { name: 'GitHub로 로그인' }).first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('T32: Google 로그인 버튼 표시 및 OAuth 리디렉션 @gate', async ({ page }) => {
    // Detects: Google OAuth 진입선 파손으로 대체 로그인 경로가 끊기는 결함
    await page.goto('/')
    const googleBtn = page.getByRole('button', { name: 'Google로 로그인' }).first()
    await expect(googleBtn).toBeVisible()

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('accounts.google.com') ||
        res.url().includes('/api/auth') ||
        res.url().includes('api/auth/signin')
      ).catch(() => null) as Promise<unknown>,
      googleBtn.click(),
    ])

    const currentUrl = page.url()
    const isValidRedirect =
      currentUrl.includes('accounts.google.com') ||
      currentUrl.includes('/api/auth') ||
      !!response
    expect(isValidRedirect).toBe(true)
  })

  test('T33: 개인정보 처리방침 링크 접근 가능 @gate', async ({ page }) => {
    // Detects: 필수 고지 페이지 링크 단절로 접근 불가해지는 결함
    await page.goto('/')
    // FF=on(v2 디렉토리) 기준: Navbar의 privacy 링크('개인정보 처리방침')를 사용.
    // banner로 스코프해 Hero·Footer의 동일 링크와의 모호성을 제거.
    await page.getByRole('banner').getByRole('link', { name: '개인정보 처리방침' }).click()
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
