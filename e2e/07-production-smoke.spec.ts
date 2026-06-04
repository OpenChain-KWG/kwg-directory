import { test, expect } from '@playwright/test'

test.describe('07 — 프로덕션 스모크 @smoke', () => {
  test('S01: 랜딩 페이지 렌더링과 소셜 로그인 버튼 노출 @smoke', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('directory-v2-page')).toBeVisible()
    await expect(page.getByRole('button', { name: 'GitHub로 로그인' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google로 로그인' }).first()).toBeVisible()
  })

  test('S02: GitHub 로그인 클릭 시 OAuth 시작 리디렉션 발생 @smoke', async ({ page }) => {
    await page.goto('/')
    const githubBtn = page.getByRole('button', { name: 'GitHub로 로그인' }).first()

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/auth') || res.url().includes('github.com')
      ).catch(() => null) as Promise<unknown>,
      githubBtn.click(),
    ])

    expect(response || page.url().includes('/api/auth') || page.url().includes('github.com')).toBeTruthy()
  })

  test('S03: Google 로그인 클릭 시 OAuth 시작 리디렉션 발생 @smoke', async ({ page }) => {
    await page.goto('/')
    const googleBtn = page.getByRole('button', { name: 'Google로 로그인' }).first()

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/auth') || res.url().includes('accounts.google.com')
      ).catch(() => null) as Promise<unknown>,
      googleBtn.click(),
    ])

    expect(
      response ||
      page.url().includes('/api/auth') ||
      page.url().includes('accounts.google.com')
    ).toBeTruthy()
  })

  test('S04: 개인정보 처리방침 페이지 접근 가능 @smoke', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
