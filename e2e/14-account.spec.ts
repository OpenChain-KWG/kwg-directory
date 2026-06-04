/**
 * 14-account.spec.ts — GDPR 자기정보 UI (profile/edit 하단 AccountDataSection)
 *
 * Art. 20 내보내기 흐름 + Art. 17 삭제 다이얼로그 안전장치를 검증한다.
 * 실제 계정 삭제(204) 실행은 공유 시드(TEST_USER) 보호를 위해 E2E에서 수행하지 않는다 —
 * 삭제 로직 자체는 통합 테스트(src/tests/integration/api/me-delete.test.ts)가 커버.
 *
 * @extended — 인증+데이터 필요(로컬 Supabase seed). `npm run test:e2e:extended`.
 */
import { test, expect } from '@playwright/test'

import { loginAsUser } from './fixtures/auth'
import { supabaseAvailable } from './fixtures/supabase'
import { T } from './helpers/testIds'

const DELETE_TOKEN = 'DELETE-MY-ACCOUNT'

test.describe('14 — GDPR 자기정보 UI', () => {
  test('ACCT-01: /profile/edit 에 데이터·계정 섹션 노출 @extended', async ({ page }) => {
    test.skip(!supabaseAvailable, 'Supabase 미연결 — 멤버 시드 불가')
    await loginAsUser(page)
    await page.goto('/profile/edit')

    await expect(page.getByTestId(T.accountDataSection)).toBeVisible({ timeout: 30000 })
    await expect(page.getByTestId(T.accountExportBtn)).toBeVisible()
    await expect(page.getByTestId(T.accountDeleteBtn)).toBeVisible()
  })

  test('ACCT-02: 데이터 내보내기 → JSON 다운로드 @extended', async ({ page }) => {
    test.skip(!supabaseAvailable, 'Supabase 미연결 — 멤버 시드 불가')
    await loginAsUser(page)
    await page.goto('/profile/edit')
    await expect(page.getByTestId(T.accountDataSection)).toBeVisible({ timeout: 30000 })

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId(T.accountExportBtn).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('kwg-directory-export')
    expect(download.suggestedFilename()).toMatch(/\.json$/)
  })

  test('ACCT-03: 삭제 다이얼로그 — 확인 토큰 입력 전 삭제 버튼 비활성 @extended', async ({ page }) => {
    test.skip(!supabaseAvailable, 'Supabase 미연결 — 멤버 시드 불가')
    await loginAsUser(page)
    await page.goto('/profile/edit')
    await expect(page.getByTestId(T.accountDataSection)).toBeVisible({ timeout: 30000 })

    await page.getByTestId(T.accountDeleteBtn).click()
    await expect(page.getByTestId(T.accountDeleteDialog)).toBeVisible()

    const confirmBtn = page.getByTestId(T.accountDeleteConfirmBtn)
    const input = page.getByTestId(T.accountDeleteConfirmInput)

    // 토큰 미입력 → 비활성
    await expect(confirmBtn).toBeDisabled()

    // 잘못된 입력 → 여전히 비활성
    await input.fill('delete')
    await expect(confirmBtn).toBeDisabled()

    // 정확한 토큰 → 활성
    await input.fill(DELETE_TOKEN)
    await expect(confirmBtn).toBeEnabled()

    // 취소 → 다이얼로그 닫힘(삭제 미실행)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId(T.accountDeleteDialog)).not.toBeVisible()
  })
})
