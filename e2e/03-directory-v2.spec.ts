/**
 * 03-directory-v2.spec.ts — E2E 시나리오: Directory v2 (Phase 3 트랙 E)
 *
 * Feature flag: NEXT_PUBLIC_FF_NEW_DIRECTORY=on (playwright.config.ts webServer env)
 * 데이터 의존성: globalSetup에서 TEST_USER(approved) 멤버 시딩 완료.
 *               추가 멤버가 필요한 경우 API route mock으로 보강.
 *
 * @gate   — CI gate 통과 필수 케이스 (빠른 경로, mock 활용)
 * @extended — 선택적 케이스 (실 Supabase 데이터 필요 또는 느린 시나리오)
 *
 * 절대 금지:
 *   - 텍스트·className 셀렉터
 *   - CSS 클래스 기반 locator
 * 사용 규칙:
 *   - getByTestId(T.xxx) 최우선
 *   - getByRole(...) 차선
 */
import { test, expect, type Page } from '@playwright/test'

import { loginAsUser } from './fixtures/auth'
import { cleanupTestData, supabaseAvailable } from './fixtures/supabase'
import { T } from './helpers/testIds'

// ---------------------------------------------------------------------------
// Mock member fixtures
// ---------------------------------------------------------------------------

const MOCK_MEMBER_A = {
  id: 'v2-mock-uid-alice',
  user_id: 'v2-mock-user-alice',
  name_ko: '김앨리스',
  name_en: 'Alice Kim',
  company: 'OpenChain Corp',
  role: '오픈소스 매니저',
  category: '기업',
  bio: null,
  email: null,
  email_public: false,
  phone: null,
  phone_public: false,
  linkedin: 'https://linkedin.com/in/alice',
  github: null,
  discord: null,
  blog: null,
  avatar_url: null,
  tags: ['SBOM', 'License'],
  approved: true,
  created_at: '2024-01-10T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
}

const MOCK_MEMBER_B = {
  id: 'v2-mock-uid-bob',
  user_id: 'v2-mock-user-bob',
  name_ko: '박밥',
  name_en: 'Bob Park',
  company: '국가연구원',
  role: '연구원',
  category: '연구/공공',
  bio: null,
  email: null,
  email_public: false,
  phone: null,
  phone_public: false,
  linkedin: null,
  github: 'https://github.com/bobpark',
  discord: null,
  blog: null,
  avatar_url: null,
  tags: ['OSS Policy'],
  approved: true,
  created_at: '2024-02-15T00:00:00Z',
  updated_at: '2024-02-15T00:00:00Z',
}

const MOCK_MEMBER_C = {
  id: 'v2-mock-uid-carol',
  user_id: 'v2-mock-user-carol',
  name_ko: '이캐롤',
  name_en: 'Carol Lee',
  company: '스타트업랩',
  role: 'CTO',
  category: '학계',
  bio: null,
  email: null,
  email_public: false,
  phone: null,
  phone_public: false,
  linkedin: null,
  github: null,
  discord: 'carollee#1234',
  blog: 'https://carol.dev',
  avatar_url: null,
  tags: ['AI', 'OSS'],
  approved: true,
  created_at: '2024-03-20T00:00:00Z',
  updated_at: '2024-03-20T00:00:00Z',
}

const ALL_MEMBERS = [MOCK_MEMBER_A, MOCK_MEMBER_B, MOCK_MEMBER_C]

/** Build a mock SearchResponse body for /api/members/search */
function searchResponse(
  members: typeof MOCK_MEMBER_A[],
  page = 1,
  total?: number,
) {
  const t = total ?? members.length
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      members,
      total: t,
      page,
      pageSize: 24,
      totalPages: Math.max(1, Math.ceil(t / 24)),
    }),
  }
}

/** Build a mock response for /api/members (legacy endpoint) */
function membersResponse(members: typeof MOCK_MEMBER_A[]) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: members, total: members.length }),
  }
}

/**
 * Navigate to `/` with the v2 directory active.
 * Waits for the page landmark to stabilise.
 */
async function gotoDirectory(page: Page) {
  await page.goto('/')
  // Wait for either the v2 page container or the legacy heading to appear.
  // The flag is set server-side via webServer env, so we prefer v2 testid.
  await page.waitForLoadState('networkidle')
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------

test.describe('03 — Directory v2 시나리오 (NEXT_PUBLIC_FF_NEW_DIRECTORY=on)', () => {
  test.afterEach(async () => {
    await cleanupTestData()
  })

  // =========================================================================
  // @gate — 검색 시나리오
  // =========================================================================

  test('T30: / 키 → 검색 input focus @gate', async ({ page }) => {
    // Detects: / 단축키가 SearchBar에 연결되지 않아 focus가 이동하지 않는 결함
    await loginAsUser(page)

    // Mock both API endpoints so the page loads without real Supabase
    await page.route('/api/members/search*', (route) =>
      route.fulfill(searchResponse(ALL_MEMBERS)),
    )
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    // Verify we're on the v2 page (flag-on path)
    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음 — NEXT_PUBLIC_FF_NEW_DIRECTORY=on 필요')
    }

    // Focus must NOT be on the input before pressing /
    await expect(page.getByTestId(T.directoryV2SearchInput)).not.toBeFocused()

    // Press / shortcut
    await page.keyboard.press('/')

    // Input should now have focus
    await expect(page.getByTestId(T.directoryV2SearchInput)).toBeFocused()
  })

  // NOTE: v2 페이지는 SSR initialMembers로 먼저 렌더되어 client `page.route` mock이
  // 표시 데이터를 제어하지 못한다(실제 시드 멤버가 보임). 특정 멤버 데이터를 단언하는
  // 본 케이스는 파일 정의상 "실 Supabase 데이터 필요 = @extended"가 올바른 분류.
  // TODO(phase-5): 시드 기반 결정적 재작성 후 검증.
  test('T31: 검색어 입력 → debounce 후 결과 카드 갱신 → 클리어 → 전체 복원 @extended', async ({
    page,
  }) => {
    // Detects: 검색 debounce·API 파라미터 매핑 누락 또는 clear 동작 미구현
    await loginAsUser(page)

    // Mock: without query → all 3; with q=김 → only MEMBER_A
    await page.route('/api/members/search*', async (route) => {
      const url = new URL(route.request().url())
      const q = url.searchParams.get('q') ?? ''
      if (q.includes('김')) {
        await route.fulfill(searchResponse([MOCK_MEMBER_A]))
      } else {
        await route.fulfill(searchResponse(ALL_MEMBERS))
      }
    })
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Verify initial result count shows all members
    const resultCount = page.getByTestId(T.directoryV2ResultCount)
    await expect(resultCount).toBeVisible()

    // Type search query
    const searchInput = page.getByTestId(T.directoryV2SearchInput)
    await searchInput.fill('김')

    // Wait for debounce + network
    await page.waitForTimeout(400)

    // Result count should now reflect filtered results
    const countText = await resultCount.textContent()
    // The count text changes to reflect filtered results (e.g. "검색 결과 1명")
    expect(countText).toBeTruthy()

    // Only MEMBER_A's card should be visible
    const cards = page.getByTestId(T.directoryV2Card)
    // At minimum one card visible, and it should contain 김앨리스
    await expect(cards.first()).toBeVisible()
    const firstCardLabel = await cards.first().getAttribute('aria-label')
    expect(firstCardLabel).toContain('김앨리스')

    // Clear the search
    const clearBtn = page.getByTestId(T.directoryV2SearchClear)
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    // After clear: input is empty
    await expect(searchInput).toHaveValue('')

    // Wait for debounce + all-members restore
    await page.waitForTimeout(400)

    // All 3 cards should be back
    const allCards = page.getByTestId(T.directoryV2Card)
    await expect(allCards).toHaveCount(3)
  })

  test('T32: 결과 카운트 텍스트 형식 검증 @gate', async ({ page }) => {
    // Detects: 결과 카운트 aria-live 영역이 없거나 포맷이 깨지는 결함
    await loginAsUser(page)

    await page.route('/api/members/search*', (route) =>
      route.fulfill(searchResponse(ALL_MEMBERS)),
    )
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Result count element has role=status and aria-live=polite
    const resultCount = page.getByTestId(T.directoryV2ResultCount)
    await expect(resultCount).toHaveAttribute('role', 'status')
    await expect(resultCount).toHaveAttribute('aria-live', 'polite')
  })

  // =========================================================================
  // @gate — 필터 시나리오
  // =========================================================================

  // NOTE: T31과 동일 — SSR 페이지라 mock이 표시 데이터를 제어 못함. 특정 멤버('박밥')
  // 단언은 실 데이터 필요 → @extended. TODO(phase-5): 시드 기반 재작성.
  test('T33: 카테고리 chip 클릭 → 그리드 갱신 → 전체 복귀 @extended', async ({ page }) => {
    // Detects: 카테고리 chip이 API 파라미터와 연결되지 않아 필터가 작동하지 않는 결함
    await loginAsUser(page)

    // Mock: category=연구/공공 → only MEMBER_B; else all
    await page.route('/api/members/search*', async (route) => {
      const url = new URL(route.request().url())
      const cat = url.searchParams.get('category') ?? ''
      if (cat === '연구/공공') {
        await route.fulfill(searchResponse([MOCK_MEMBER_B]))
      } else {
        await route.fulfill(searchResponse(ALL_MEMBERS))
      }
    })
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Filters area should be visible
    await expect(page.getByTestId(T.directoryV2Filters)).toBeVisible()

    // Find the 연구/공공 chip by its data-value attribute
    const researchChip = page
      .getByTestId(T.directoryV2FilterChip)
      .filter({ hasText: '연구/공공' })
    await expect(researchChip).toBeVisible()

    // Click the category chip
    await researchChip.click()

    // Wait for filter to apply
    await page.waitForTimeout(400)

    // chip should be checked
    await expect(researchChip).toHaveAttribute('aria-checked', 'true')

    // Only 박밥's card should appear
    const cards = page.getByTestId(T.directoryV2Card)
    await expect(cards).toHaveCount(1)
    const label = await cards.first().getAttribute('aria-label')
    expect(label).toContain('박밥')

    // Click "전체" chip to reset
    const allChip = page
      .getByTestId(T.directoryV2FilterChip)
      .filter({ hasText: '전체' })
    await allChip.click()
    await page.waitForTimeout(400)

    await expect(allChip).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(3)
  })

  test('T34: 정렬 Select → "최근 가입순" 선택 @gate', async ({ page }) => {
    // Detects: sort Select가 API sort 파라미터와 연결되지 않아 정렬이 변경되지 않는 결함
    await loginAsUser(page)

    // Track sort parameter changes
    const sortParams: string[] = []
    await page.route('/api/members/search*', async (route) => {
      const url = new URL(route.request().url())
      const sort = url.searchParams.get('sort') ?? ''
      sortParams.push(sort)
      // Return reversed order for 'recent' to simulate different ordering
      if (sort === 'recent') {
        await route.fulfill(searchResponse([MOCK_MEMBER_C, MOCK_MEMBER_B, MOCK_MEMBER_A]))
      } else {
        await route.fulfill(searchResponse(ALL_MEMBERS))
      }
    })
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Sort Select should be visible
    const sortSelect = page.getByTestId(T.directoryV2SortSelect)
    await expect(sortSelect).toBeVisible()

    // Click the sort trigger to open
    await sortSelect.click()

    // Select "최근 가입순" option
    await page.getByRole('option', { name: '최근 가입순' }).click()

    // Wait for fetch
    await page.waitForTimeout(400)

    // API should have received sort=recent
    expect(sortParams.some((s) => s === 'recent')).toBe(true)

    // Cards still render (3 items)
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(3)
  })

  // =========================================================================
  // @gate — 상세 시나리오 (MemberDetailSheet)
  // =========================================================================

  test('T35: 카드 클릭 → MemberDetailSheet 열림 → Esc 닫기 → 디렉토리 유지 @gate', async ({
    page,
  }) => {
    // Detects: Intercepting Route 연결 누락 또는 Esc 키 핸들러 미구현
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)
    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Click the first card
    const firstCard = page.getByTestId(T.directoryV2Card).first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()

    // MemberDetailSheet (or dialog) should open
    const sheet = page.getByTestId(T.memberDetailSheet)
    await expect(sheet).toBeVisible({ timeout: 5000 })

    // Sheet title should be visible
    await expect(page.getByTestId(T.memberDetailSheetTitle)).toBeVisible()

    // Nav footer should be visible
    await expect(page.getByTestId(T.memberDetailSheetNav)).toBeVisible()

    // Prev/Next buttons should be in the sheet
    const prevBtn = page.getByTestId(T.memberDetailPrevBtn)
    const nextBtn = page.getByTestId(T.memberDetailNextBtn)
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Press Escape to close the sheet
    await page.keyboard.press('Escape')

    // Sheet should close
    await expect(sheet).not.toBeVisible({ timeout: 3000 })

    // Directory page should still be visible (URL back to /)
    await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('T36: 카드 클릭 → Sheet → ←/→ 키보드 네비 @gate', async ({ page }) => {
    // Detects: ←/→ 키보드 이벤트가 MemberDetailSheet의 goTo()와 연결되지 않는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)
    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Need at least 2 cards for navigation
    const cards = page.getByTestId(T.directoryV2Card)
    const count = await cards.count()
    if (count < 2) {
      test.skip(true, '카드가 2개 이상 필요합니다')
    }

    // Click the SECOND card so ArrowLeft can navigate to first
    await cards.nth(1).click()

    const sheet = page.getByTestId(T.memberDetailSheet)
    await expect(sheet).toBeVisible({ timeout: 5000 })

    // Get current member name
    const titleBefore = await page
      .getByTestId(T.memberDetailSheetTitle)
      .textContent()

    // The previous button should be enabled (we clicked the 2nd card)
    const prevBtn = page.getByTestId(T.memberDetailPrevBtn)
    await expect(prevBtn).not.toBeDisabled()

    // Press ArrowLeft to navigate to previous member
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)

    // Sheet should still be open but showing a different member
    await expect(sheet).toBeVisible()
    const titleAfter = await page
      .getByTestId(T.memberDetailSheetTitle)
      .textContent()
    expect(titleAfter).not.toEqual(titleBefore)

    // Press ArrowRight to go back
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    await expect(sheet).toBeVisible()
  })

  // =========================================================================
  // @extended — CommandMenu 시나리오
  // =========================================================================

  test('T37: Cmd+K → CommandMenu 열림 → 검색어 → 결과 클릭 → /members/[id] 이동 @extended', async ({
    page,
  }) => {
    // Detects: Cmd+K 단축키 연결 누락 또는 CommandMenu 검색결과 클릭 라우팅 누락
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)

    // Mock search endpoint for command menu
    await page.route('/api/members/search*', async (route) => {
      const url = new URL(route.request().url())
      const q = url.searchParams.get('q') ?? ''
      if (q.trim()) {
        await route.fulfill(searchResponse([MOCK_MEMBER_A]))
      } else {
        await route.fulfill(searchResponse(ALL_MEMBERS))
      }
    })
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Open CommandMenu with Cmd+K (Meta+K on Mac, Ctrl+K on others)
    const isMac = process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k')

    // CommandMenu dialog should open
    const cmdMenu = page.getByTestId(T.directoryCommandMenu)
    await expect(cmdMenu).toBeVisible({ timeout: 3000 })

    // Input should be visible and focused
    const cmdInput = page.getByTestId(T.directoryCommandMenuInput)
    await expect(cmdInput).toBeVisible()

    // Type a search query
    await cmdInput.fill('앨리스')
    await page.waitForTimeout(300)

    // Result items should appear
    const resultItems = page.getByTestId(T.directoryCommandMenuResult)
    await expect(resultItems.first()).toBeVisible({ timeout: 3000 })

    // Click the first result
    await resultItems.first().click()

    // Should navigate to /members/[id]
    await expect(page).toHaveURL(/\/members\//, { timeout: 5000 })
  })

  test('T38: CommandMenu 닫기 → Escape @extended', async ({ page }) => {
    // Detects: CommandMenu Escape 핸들러 또는 onOpenChange 누락
    await loginAsUser(page)

    await page.route('/api/members/search*', (route) =>
      route.fulfill(searchResponse(ALL_MEMBERS)),
    )
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    const isMac = process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k')

    const cmdMenu = page.getByTestId(T.directoryCommandMenu)
    await expect(cmdMenu).toBeVisible({ timeout: 3000 })

    // Escape closes the menu
    await page.keyboard.press('Escape')
    await expect(cmdMenu).not.toBeVisible({ timeout: 3000 })

    // Directory is still on screen
    await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
  })

  // =========================================================================
  // @extended — 직접 URL 접근 (풀페이지 렌더)
  // =========================================================================

  test('T39: /members/[id] 직접 방문 → 풀페이지 상세 렌더 @extended', async ({
    page,
  }) => {
    // Detects: 직접 URL 접근 시 Intercepting Route fallback 미구현으로 500/404 발생
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)

    // First go to the directory to get a real member id
    await page.route('/api/members/search*', (route) =>
      route.fulfill(searchResponse(ALL_MEMBERS)),
    )
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )
    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Pick a real card
    const firstCard = page.getByTestId(T.directoryV2Card).first()
    await expect(firstCard).toBeVisible()
    const memberId = await firstCard.getAttribute('data-member-id')
    if (!memberId) {
      test.skip(true, 'data-member-id 속성 없음')
    }

    // Navigate directly to /members/[id] — full page (no intercepting route)
    await page.goto(`/members/${memberId}`)

    // Should render member detail sheet (full page mode)
    const sheet = page.getByTestId(T.memberDetailSheet)
    await expect(sheet).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId(T.memberDetailSheetTitle)).toBeVisible()
  })

  // =========================================================================
  // @gate — 빈 상태 시나리오
  // =========================================================================

  test('T40: 검색 결과 없음 → EmptyState 표시 → 리셋 → 전체 복원 @gate', async ({
    page,
  }) => {
    // Detects: empty state 컴포넌트 미표시 또는 reset 버튼 미연결
    await loginAsUser(page)

    await page.route('/api/members/search*', async (route) => {
      const url = new URL(route.request().url())
      const q = url.searchParams.get('q') ?? ''
      if (q.trim()) {
        // Return empty results for any search query
        await route.fulfill(searchResponse([]))
      } else {
        await route.fulfill(searchResponse(ALL_MEMBERS))
      }
    })
    await page.route('/api/members*', (route) =>
      route.fulfill(membersResponse(ALL_MEMBERS)),
    )

    await gotoDirectory(page)

    const v2Page = page.getByTestId(T.directoryV2Page)
    if (!(await v2Page.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Directory v2 flag이 꺼져 있음')
    }

    // Enter a search term that yields no results
    const searchInput = page.getByTestId(T.directoryV2SearchInput)
    await searchInput.fill('존재하지않는이름xyz')
    await page.waitForTimeout(400)

    // Empty state should appear
    const emptyState = page.getByTestId(T.directoryV2EmptyState)
    await expect(emptyState).toBeVisible()

    // Reset button in empty state
    const resetBtn = page.getByTestId(T.directoryV2EmptyReset)
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()

    // Search input should be cleared
    await expect(searchInput).toHaveValue('')

    // Cards should restore
    await page.waitForTimeout(400)
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(3)
  })
})
