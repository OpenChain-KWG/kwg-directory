import { test, expect } from '@playwright/test'
import { join } from 'path'
import { loginAsUser } from './fixtures/auth'
import { supabaseAvailable, cleanupTestData } from './fixtures/supabase'
import { T } from './helpers/testIds'

test.describe('02 — 프로필 등록 검증', () => {
  test.afterEach(async () => {
    // test-user의 프로필 데이터 정리
    await cleanupTestData()
  })

  test('T04: 프로필 등록 전체 흐름 (아바타 + 태그) @extended', async ({ page }) => {
    // Detects: 등록 요청 성공 후 완료 상태가 렌더링되지 않는 결함
    test.skip(!supabaseAvailable, 'Supabase 미연결 환경 — 홈 페이지 렌더링 대기 불가')
    await loginAsUser(page)

    // /api/members POST 인터셉트 (실제 DB 저장 없이 검증)
    await page.route('/api/members', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-member-id', approved: false }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/profile/new')
    await expect(page.getByTestId(T.profileFormHeading)).toBeVisible()

    // 아바타 업로드 (선택적)
    const avatarInput = page.locator('input[type="file"]').first()
    if (await avatarInput.isVisible().catch(() => false)) {
      const avatarPath = join(__dirname, 'fixtures', 'test-avatar.jpg')
      await avatarInput.setInputFiles(avatarPath)
    }

    // 필수 필드 입력 (단일 페이지 — testid 기반)
    await page.getByTestId(T.registrationInputNameKo).fill('E2E테스트')
    await page.getByTestId(T.registrationInputCompany).fill('테스트기업')
    await page.getByTestId(T.registrationInputRole).fill('Test Engineer')
    await page.getByTestId(T.registrationInputContactEmail).fill('test@example.com')

    // 태그 3개 선택
    await page.getByRole('button', { name: 'SBOM' }).click()
    await page.getByRole('button', { name: 'Legal' }).click()
    await page.getByRole('button', { name: 'Security' }).click()
    await expect(page.getByText('3 / 10')).toBeVisible()

    // 개인정보 동의 (마지막 체크박스 = privacy_agreed)
    await page.getByRole('checkbox').last().check()

    // 제출 → 인라인 성공 화면 확인 (리다이렉트 없음)
    await page.getByTestId(T.registrationSubmitBtn).click()
    await expect(page.getByTestId(T.registrationSuccess)).toBeVisible()
  })

  test('T05: 필수값(이름 한글) 미입력 시 제출 버튼 비활성 @gate', async ({ page }) => {
    // Detects: 필수값 검증 누락으로 불완전 프로필이 제출되는 결함
    await loginAsUser(page)
    await page.goto('/profile/new')

    await expect(page.getByTestId(T.profileFormHeading)).toBeVisible()

    // 소속만 입력하고 이름은 비워둠
    await page.getByTestId(T.registrationInputCompany).fill('테스트기업')

    // 제출 버튼 disabled 확인
    await expect(page.getByTestId(T.registrationSubmitBtn)).toBeDisabled()
  })

  test('T06: 로그인 후 Navbar에 프로필 관련 링크 표시 @extended', async ({ page }) => {
    // Detects: 로그인 상태에서 등록/수정 네비게이션 분기가 깨지는 결함
    await loginAsUser(page)
    await page.goto('/')
    // 프로필 있으면 "내 정보 수정", 없으면 "내 정보 등록"
    // 환경(Supabase 시딩 여부)에 관계없이 반드시 둘 중 하나가 표시되어야 함
    await expect(
      page.getByTestId(T.editProfileLink).or(page.getByTestId(T.registerProfileLink))
    ).toBeVisible()
  })

  test('T30: 프로필 등록 API 실패 시 에러 메시지 표시 @extended', async ({ page }) => {
    // Detects: 서버 실패 시 사용자 피드백 없이 무반응 상태로 남는 결함
    await loginAsUser(page)
    await page.route('/api/members', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: '등록 실패' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/profile/new')
    await page.getByTestId(T.registrationInputNameKo).fill('에러테스트')
    await page.getByTestId(T.registrationInputCompany).fill('테스트기업')
    await page.getByTestId(T.registrationInputRole).fill('QA')
    await page.getByTestId(T.registrationInputContactEmail).fill('qa@test.com')
    await page.getByRole('checkbox').last().check()
    await page.getByTestId(T.registrationSubmitBtn).click()

    await expect(page.getByText('등록 실패')).toBeVisible()
  })

  test('T31: 등록 버튼 더블클릭 시 중복 요청 방지 @extended', async ({ page }) => {
    // Detects: 중복 클릭으로 동일 프로필이 중복 생성되는 결함
    let postCount = 0
    await loginAsUser(page)
    await page.route('/api/members', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'dedupe-test-member' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/profile/new')
    await page.getByTestId(T.registrationInputNameKo).fill('중복요청테스트')
    await page.getByTestId(T.registrationInputCompany).fill('테스트기업')
    await page.getByTestId(T.registrationInputRole).fill('QA')
    await page.getByTestId(T.registrationInputContactEmail).fill('qa+dedupe@test.com')
    await page.getByRole('checkbox').last().check()

    const submitButton = page.getByTestId(T.registrationSubmitBtn)
    await Promise.all([submitButton.click(), submitButton.click()])

    await expect(page.getByTestId(T.registrationSuccess)).toBeVisible()
    expect(postCount).toBe(1)
  })
})
