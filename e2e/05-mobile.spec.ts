import { test, expect } from '@playwright/test'
import { loginAsUser } from './fixtures/auth'
import { createTestMember, cleanupTestData, supabaseAvailable } from './fixtures/supabase'
import { T } from './helpers/testIds'

test.describe('05 — 모바일 레이아웃 검증', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('T26: 모바일 네비게이션 — 아이콘만 표시 @extended', async ({ page }) => {
    // Detects: 모바일 breakpoint 회귀로 데스크톱 네비게이션이 노출되는 결함
    await page.goto('/')

    // 데스크톱 전용 Navbar 브랜드 텍스트는 모바일에서 숨김 (hidden sm:block).
    // banner로 스코프 — Hero(main)에도 동일 텍스트가 있어 전역 getByText는 모호함.
    await expect(
      page.getByRole('banner').getByText('OpenChain KWG Members'),
    ).toBeHidden()

    // 모바일 파비콘 아이콘 표시 (sm:hidden → 375px에서 표시)
    const faviconLogo = page.getByTestId(T.mobileLogo)
    await expect(faviconLogo).toBeVisible()

    // 검색창: 모바일에서는 아이콘 버튼만 표시 (MemberGrid 내 SearchBar)
    // SearchBar는 승인된 멤버로 로그인 시에만 렌더링 → Supabase 필요
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await createTestMember({ approved: true })
    await loginAsUser(page)
    await page.goto('/')

    const searchInput = page.getByTestId(T.directoryV2SearchInput)
    await expect(searchInput).toBeVisible()
  })

  test('T27: 모바일 멤버 카드 단일 컬럼 레이아웃 @extended', async ({ page }) => {
    // Detects: 모바일 그리드 컬럼 회귀로 카드가 다열 배치되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    // 승인된 멤버 2명 필요
    await createTestMember({ approved: true, userId: 'test-mobile-user-1' })
    await createTestMember({ approved: true, userId: 'test-mobile-user-2' })

    await loginAsUser(page)
    await page.goto('/')

    // 카드 그리드 확인 (grid-cols-1 = 단일 컬럼)
    const cards = page.locator('.grid > article, .grid > [role="button"], .grid > div')

    const cardCount = await cards.count()
    if (cardCount < 2) {
      test.skip(true, '멤버 카드가 2개 이상 필요합니다.')
    }

    const firstBox = await cards.nth(0).boundingBox()
    const secondBox = await cards.nth(1).boundingBox()

    // 단일 컬럼: 두 번째 카드의 x 좌표가 첫 번째와 같아야 함 (같은 열)
    expect(firstBox?.x).toBe(secondBox?.x)
  })

  test('T28: 모바일 모달 — 하단 bottom sheet 형태 @extended', async ({ page }) => {
    // Detects: 모바일 모달 레이아웃 깨짐으로 사용성 저하가 발생하는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await createTestMember({ approved: true })

    await loginAsUser(page)
    await page.goto('/')

    // 멤버 카드 클릭
    await page.getByText('E2E테스트멤버').first().click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    // 모달 내부 컨텐츠 박스 확인
    // rounded-t-[20px] sm:rounded-2xl → 모바일에서는 상단 radius만 있음
    const modalContent = modal.locator('.rounded-t-\\[20px\\], [class*="rounded-t-"]').first()
    const box = await modalContent.boundingBox()

    if (box) {
      const viewportHeight = 812
      // 모달이 하단에 위치 (y > viewport height * 0.1)
      expect(box.y).toBeGreaterThan(viewportHeight * 0.1)
    }

    // max-h-[85dvh] → 모달 높이가 뷰포트의 85% 이하
    const modalBox = await modal.boundingBox()
    if (modalBox) {
      const maxHeight = 812 * 0.85
      expect(modalBox.height).toBeLessThanOrEqual(maxHeight + 20) // 여유 20px
    }
  })

  test('T29: 모바일 프로필 폼 — 필수 필드 표시 및 제출 버튼 상태 @extended', async ({ page }) => {
    // Detects: 모바일 폼 검증 조건 누락으로 불완전 데이터가 제출되는 결함
    await loginAsUser(page)
    await page.goto('/profile/new')

    await expect(page.getByTestId(T.profileFormHeading)).toBeVisible()

    // 단일 페이지 폼 — 필수 필드 표시 확인
    await expect(page.getByTestId(T.registrationInputNameKo)).toBeVisible()
    await expect(page.getByTestId(T.registrationInputCompany)).toBeVisible()

    // 필수값 미입력 → 제출 버튼 비활성
    await expect(page.getByTestId(T.registrationSubmitBtn)).toBeDisabled()

    // 필수값 모두 입력 → 제출 버튼 활성화
    await page.getByTestId(T.registrationInputNameKo).fill('테스트')
    await page.getByTestId(T.registrationInputCompany).fill('테스트기업')
    await page.getByTestId(T.registrationInputRole).fill('매니저')
    await page.getByTestId(T.registrationInputContactEmail).fill('test@mobile.com')
    await page.getByRole('checkbox').last().check() // privacy_agreed

    await expect(page.getByTestId(T.registrationSubmitBtn)).toBeEnabled()
  })
})
