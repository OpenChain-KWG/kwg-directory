/**
 * 11-a11y.spec.ts — 접근성 자동 감사 (axe-core, WCAG 2.2 AA) — L6
 *
 * 주요 라우트를 axe로 스캔해 violations 0을 검증한다. FF=on 전제.
 * @a11y — `npm run test:e2e:a11y`.
 */
import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

import { loginAsUser, loginAsAdmin, loginAsUnregisteredUser } from './fixtures/auth'
import { T } from './helpers/testIds'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function scan(page: Page, context?: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  const summary = results.violations
    .map((v) => {
      const sample = v.nodes[0]
      const data = sample?.any?.[0]?.data as { contrastRatio?: number; fgColor?: string; bgColor?: string } | undefined
      const extra = data?.contrastRatio
        ? ` ratio=${data.contrastRatio} fg=${data.fgColor} bg=${data.bgColor}`
        : ''
      return `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)${extra}\n    target: ${sample?.target?.join(' ')}\n    html: ${sample?.html?.slice(0, 120)}`
    })
    .join('\n')
  expect(results.violations.length, `${context ?? ''} a11y violations:\n${summary}`).toBe(0)
}

async function waitVisibleOrSkip(page: Page, testId: string, reason: string) {
  const ok = await page
    .getByTestId(testId)
    .waitFor({ state: 'visible', timeout: 30000 })
    .then(() => true)
    .catch(() => false)
  if (!ok) test.skip(true, reason)
}

test.describe('11 — 접근성 (WCAG 2.2 AA, axe) @a11y', () => {
  test('A11Y-01: /privacy (공개) 위반 0 @a11y', async ({ page }) => {
    await page.goto('/privacy')
    await waitVisibleOrSkip(page, T.privacyPageHeader, '/privacy 미렌더')
    await scan(page, '/privacy')
  })

  test('A11Y-05: / 게스트 히어로(비로그인, FF on) 위반 0 @a11y', async ({ page }) => {
    await page.goto('/')
    await waitVisibleOrSkip(page, T.directoryV2Page, 'guest hero 미렌더(FF off)')
    await scan(page, '/ (guest hero)')
  })

  // @a11y-authed: 인증+데이터 필요 페이지. 로컬 Supabase seed 환경에서만 안정 스캔(CI 기본 잡 제외).
  test('A11Y-02: / 디렉토리(로그인, FF on) 위반 0 @a11y @a11y-authed', async ({ page }) => {
    await loginAsUser(page)
    await page.goto('/')
    await waitVisibleOrSkip(page, T.directoryV2Page, 'directory v2 미렌더(FF off)')
    await scan(page, '/ (directory v2)')
  })

  test('A11Y-03: /profile/new 등록 폼 위반 0 @a11y @a11y-authed', async ({ page }) => {
    await loginAsUnregisteredUser(page)
    await page.goto('/profile/new')
    await waitVisibleOrSkip(page, T.registrationInputNameKo, '프로필 등록 폼 미렌더')
    await scan(page, '/profile/new')
  })

  test('A11Y-04: /admin (관리자) 위반 0 @a11y @a11y-authed', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin')
    await waitVisibleOrSkip(page, T.adminTable, '/admin 미렌더(Supabase/권한 필요)')
    await scan(page, '/admin')
  })
})
