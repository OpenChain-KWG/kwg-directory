import { test, expect } from '@playwright/test'
import { loginAsUser } from './fixtures/auth'
import { cleanupTestData, supabaseAvailable } from './fixtures/supabase'

// 검색 결과를 mock하기 위한 더미 멤버 (SSR 초기 데이터와 이름이 겹치지 않도록 고유 이름 사용)
const MEMBER_A = {
  id: 'search-mock-uid-1',
  user_id: 'test-search-mock-1',
  name_ko: '검색결과가나다',
  name_en: null,
  company: 'SK텔레콤',
  role: '오픈소스 매니저',
  category: '기업',
  bio: null,
  email: null,
  email_public: false,
  phone: null,
  phone_public: false,
  linkedin: null,
  github: null,
  discord: null,
  blog: null,
  avatar_url: null,
  tags: [],
  approved: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const MEMBER_B = {
  ...MEMBER_A,
  id: 'search-mock-uid-2',
  user_id: 'test-search-mock-2',
  name_ko: '검색결과라마바',
  company: '삼성전자',
}

function mockResponse(members: typeof MEMBER_A[]) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: members, total: members.length, page: 1, totalPages: 1 }),
  }
}

test.describe('06 — 검색/필터 검증', () => {
  test.afterEach(async () => {
    await cleanupTestData()
  })

  test('T18: 이름으로 검색 → 결과 필터링 @extended', async ({ page }) => {
    // Detects: 검색어 반영 실패로 결과 집합이 축소되지 않는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')
    await loginAsUser(page)

    // 검색 API 응답 mock: search 파라미터에 따라 다른 결과 반환
    await page.route('/api/members*', async (route) => {
      const url = new URL(route.request().url())
      const search = url.searchParams.get('search') ?? ''
      if (search.includes('가나다')) {
        await route.fulfill(mockResponse([MEMBER_A]))
      } else {
        await route.fulfill(mockResponse([MEMBER_A, MEMBER_B]))
      }
    })

    await page.goto('/')

    // 검색창에 이름 입력 (데스크톱 너비에서는 항상 표시됨)
    const searchInput = page.getByRole('textbox')
    await searchInput.fill('가나다')

    // MEMBER_A만 표시, MEMBER_B는 미표시
    await expect(page.getByText('검색결과가나다')).toBeVisible()
    await expect(page.getByText('검색결과라마바')).not.toBeVisible()
  })

  test('T19: 소속으로 검색 → 결과 필터링 @extended', async ({ page }) => {
    // Detects: 소속 검색 인덱스/쿼리 매핑 오류로 오탐이 발생하는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)

    await page.route('/api/members*', async (route) => {
      const url = new URL(route.request().url())
      const search = url.searchParams.get('search') ?? ''
      if (search.includes('삼성')) {
        await route.fulfill(mockResponse([MEMBER_B]))
      } else {
        await route.fulfill(mockResponse([MEMBER_A, MEMBER_B]))
      }
    })

    await page.goto('/')

    const searchInput = page.getByRole('textbox')
    await searchInput.fill('삼성')
    // MEMBER_B(삼성전자)만 표시, MEMBER_A(SK텔레콤)는 미표시
    await expect(page.getByText('검색결과라마바')).toBeVisible()
    await expect(page.getByText('검색결과가나다')).not.toBeVisible()
  })

  test('T20: 검색어 초기화 → 전체 목록 복원 @extended', async ({ page }) => {
    // Detects: 검색 상태 초기화 누락으로 결과가 영구 필터링되는 결함
    test.skip(!supabaseAvailable, 'Supabase 연결이 필요한 테스트입니다.')

    await loginAsUser(page)

    await page.route('/api/members*', async (route) => {
      const url = new URL(route.request().url())
      const search = url.searchParams.get('search') ?? ''
      if (search) {
        await route.fulfill(mockResponse([MEMBER_A]))
      } else {
        await route.fulfill(mockResponse([MEMBER_A, MEMBER_B]))
      }
    })

    await page.goto('/')

    const searchInput = page.getByRole('textbox')

    // 검색어 입력
    await searchInput.fill('가나다')
    await expect(page.getByText('검색결과라마바')).not.toBeVisible()

    // 검색 초기화 버튼 (SearchBar의 X 버튼)
    await page.getByRole('button', { name: '검색 초기화' }).click()
    // 전체 목록 복원 — 두 멤버 모두 표시
    await expect(page.getByText('검색결과가나다')).toBeVisible()
    await expect(page.getByText('검색결과라마바')).toBeVisible()
  })
})
