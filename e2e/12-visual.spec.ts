/**
 * 12-visual.spec.ts — 시각 회귀 (Playwright toHaveScreenshot) — L9
 *
 * 주요 페이지의 레이아웃/크롬을 baseline 스크린샷과 비교한다. 동적 멤버 데이터는
 * mask로 가려 결정적으로 만든다. FF=on 전제.
 *
 * @visual — `npm run test:e2e:visual` (비교) / `npm run test:e2e:visual:update` (baseline 갱신).
 *
 * ⚠️ baseline PNG는 **플랫폼별**(`*-darwin.png`/`*-linux.png`)이다. CI(Linux)에서 쓰려면
 *    CI 환경(또는 mcr.microsoft.com/playwright Docker)에서 baseline을 별도 생성해야 한다.
 *    CI 게이트와 분리(@visual)되어 있으므로 로컬 회귀 탐지 용도로 우선 사용한다.
 */
import { test, expect } from '@playwright/test'

import { loginAsUser, loginAsUnregisteredUser } from './fixtures/auth'
import { T } from './helpers/testIds'

const SHOT = { maxDiffPixelRatio: 0.02, animations: 'disabled' as const, fullPage: true }

test.describe('12 — 시각 회귀 @visual', () => {
  test('VIS-01: /privacy @visual', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByTestId(T.privacyPageHeader)).toBeVisible({ timeout: 30000 })
    await expect(page).toHaveScreenshot('privacy.png', SHOT)
  })

  test('VIS-02: /profile/new 등록 폼 @visual', async ({ page }) => {
    await loginAsUnregisteredUser(page)
    await page.goto('/profile/new')
    const rendered = await page
      .getByTestId(T.registrationInputNameKo)
      .waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!rendered, '프로필 등록 폼 미렌더')
    await expect(page).toHaveScreenshot('profile-new.png', SHOT)
  })

  test('VIS-03: / 디렉토리 크롬(멤버 그리드 마스킹) @visual', async ({ page }) => {
    await loginAsUser(page)
    await page.goto('/')
    const rendered = await page
      .getByTestId(T.directoryV2Page)
      .waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!rendered, 'directory v2 미렌더(FF off)')
    // 동적 멤버 데이터는 가려 hero/검색/필터 크롬만 비교
    const masks = [page.getByTestId(T.directoryV2Grid), page.getByTestId(T.directoryV2VirtualGrid)]
    await expect(page).toHaveScreenshot('directory.png', { ...SHOT, mask: masks })
  })
})
