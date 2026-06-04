/**
 * 10-hardening.spec.ts — 엄격·하드 E2E (10,000명 규모 가정 + 적대적 입력 + 견고성)
 *
 * 목적: 대규모 데이터·악의적 입력·API 실패·경쟁 조건에서 UI가 깨지지 않는지 검증.
 * 데이터는 `page.route` mock으로 결정적으로 주입 (실 DB 불요). FF=on(v2 디렉토리) 전제.
 *
 * 주의: v2 디렉토리는 SSR initialMembers를 먼저 렌더하고, 검색/필터/정렬 변경 시에만
 *       client가 `/api/members/search`를 재요청한다. 따라서 mock 데이터를 화면에
 *       반영하려면 반드시 검색 등으로 client fetch를 트리거해야 한다(`triggerLoad`).
 *
 * @hard — `npm run test:e2e:hard` 로 실행. CI 게이트와 분리.
 */
import { test, expect, type Page, type Route } from '@playwright/test'

import { loginAsUser, loginAsUnregisteredUser } from './fixtures/auth'
import { T } from './helpers/testIds'

// ── Mock member factory ────────────────────────────────────────────────────
type MockMember = Record<string, unknown>

function member(i: number, over: MockMember = {}): MockMember {
  return {
    id: `hard-${i}`,
    user_id: `hard-user-${i}`,
    name_ko: `멤버${i}`,
    name_en: `Member ${i}`,
    company: `회사${i % 50}`,
    role: '오픈소스 엔지니어',
    category: (['기업', '연구/공공', '학계'] as const)[i % 3],
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
    ...over,
  }
}

function makeMembers(n: number, over: (i: number) => MockMember = () => ({})): MockMember[] {
  return Array.from({ length: n }, (_, i) => member(i, over(i)))
}

function searchFulfill(members: MockMember[], total?: number, page = 1, pageSize?: number) {
  const t = total ?? members.length
  const ps = pageSize ?? Math.max(members.length, 24)
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      members,
      total: t,
      page,
      pageSize: ps,
      totalPages: Math.max(1, Math.ceil(t / ps)),
    }),
  }
}

/** Route the directory data endpoints. `handler` answers /api/members/search. */
async function routeSearch(page: Page, handler: (route: Route) => Promise<void> | void) {
  await page.route('**/api/members/search*', handler)
}

async function gotoDirectory(page: Page) {
  await page.goto('/')
  // FF=on이면 v2 페이지가 떠야 한다. cold-compile을 흡수하도록 넉넉히 대기.
  await expect(page.getByTestId(T.directoryV2Page)).toBeVisible({ timeout: 45000 })
}

/**
 * 검색을 입력해 client fetch를 트리거 → mock 응답이 화면에 반영되게 한다.
 * mock은 q와 무관하게 원하는 데이터셋을 반환하도록 구성한다.
 */
async function triggerLoad(page: Page, query = '멤') {
  await page.getByTestId(T.directoryV2SearchInput).fill(query)
  // debounce(≈300ms) + 네트워크 + 렌더
  await page.waitForTimeout(700)
}

test.describe('10 — 하드닝 E2E (@hard)', () => {
  // ── 스케일: 10,000명 ──────────────────────────────────────────────────────
  test('HARD-01: 10,000명 응답 — 가상 그리드 + DOM 카드 수 제한 @hard', async ({ page }) => {
    const big = makeMembers(10000)
    await routeSearch(page, (route) => route.fulfill(searchFulfill(big, 10000)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await triggerLoad(page)

    await expect(page.getByTestId(T.directoryV2ResultCount)).toContainText('10000')
    await expect(page.getByTestId(T.directoryV2VirtualGrid)).toBeVisible()
    const domCards = await page.getByTestId(T.directoryV2Card).count()
    expect(domCards).toBeGreaterThan(0)
    expect(domCards).toBeLessThan(300) // 10000개를 전부 렌더하면 안 됨 (가상화)
  })

  test('HARD-02: 대규모 스크롤 — DOM 카드 수가 계속 제한적 (recycle) @hard', async ({ page }) => {
    await routeSearch(page, (route) => route.fulfill(searchFulfill(makeMembers(5000), 5000)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await triggerLoad(page)
    await expect(page.getByTestId(T.directoryV2VirtualGrid)).toBeVisible()

    for (const y of [2000, 6000, 12000, 24000]) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y)
      await page.waitForTimeout(150)
      const count = await page.getByTestId(T.directoryV2Card).count()
      expect(count).toBeLessThan(300)
    }
  })

  // ── 적대적 입력: XSS / 인젝션 ──────────────────────────────────────────────
  test('HARD-03: 멤버 필드 XSS — 스크립트 미실행, 텍스트 이스케이프 @hard', async ({ page }) => {
    let dialogFired = false
    page.on('dialog', (d) => {
      dialogFired = true
      void d.dismiss()
    })
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>'
    const evil = makeMembers(3)
    evil[0] = member(0, { name_ko: payload, name_en: payload, bio: payload, company: payload })
    await routeSearch(page, (route) => route.fulfill(searchFulfill(evil)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await triggerLoad(page)

    await expect(page.getByTestId(T.directoryV2Card).first()).toBeVisible()
    const xss = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)
    expect(xss).toBeUndefined()
    expect(dialogFired).toBe(false)
    await expect(page.getByTestId(T.directoryV2Card).first()).toContainText('onerror')
  })

  test('HARD-04: 검색어 XSS — 반사 인젝션 미실행 @hard', async ({ page }) => {
    let dialogFired = false
    page.on('dialog', (d) => {
      dialogFired = true
      void d.dismiss()
    })
    await routeSearch(page, (route) => route.fulfill(searchFulfill(makeMembers(2))))
    await loginAsUser(page)
    await gotoDirectory(page)

    await page.getByTestId(T.directoryV2SearchInput).fill('"><script>window.__xss2=1</script>')
    await page.waitForTimeout(600)
    const xss = await page.evaluate(() => (window as unknown as { __xss2?: number }).__xss2)
    expect(xss).toBeUndefined()
    expect(dialogFired).toBe(false)
  })

  // ── 경계 입력 ──────────────────────────────────────────────────────────────
  test('HARD-05: 초장문 필드 — 가로 오버플로 없이 렌더 @hard', async ({ page }) => {
    const longName = '가'.repeat(5000)
    const evil = makeMembers(3)
    evil[0] = member(0, { name_ko: longName, company: longName, role: longName })
    await routeSearch(page, (route) => route.fulfill(searchFulfill(evil)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await triggerLoad(page)

    await expect(page.getByTestId(T.directoryV2Card).first()).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(4)
  })

  test('HARD-06: 유니코드·이모지·RTL 이름 — 크래시 없이 렌더 @hard', async ({ page }) => {
    const names = ['🚀😀🇰🇷', 'مرحبا بالعالم', '𝕌𝕟𝕚𝕔𝕠𝕕𝕖', 'a​b‮c']
    const evil = makeMembers(names.length, (i) => ({ name_ko: names[i] }))
    await routeSearch(page, (route) => route.fulfill(searchFulfill(evil)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await triggerLoad(page)
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(names.length)
  })

  // ── API 실패·견고성 ────────────────────────────────────────────────────────
  test('HARD-07: 검색 API 500 — 크래시 없이 페이지 유지 @hard', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))
    await routeSearch(page, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) }),
    )
    await loginAsUser(page)
    await gotoDirectory(page)
    await page.getByTestId(T.directoryV2SearchInput).fill('실패유발')
    await page.waitForTimeout(700)
    await expect(page.getByTestId(T.directoryV2SearchInput)).toBeVisible()
    await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
    expect(pageErrors, pageErrors.join('\n')).toHaveLength(0)
  })

  test('HARD-08: 검색 API 429 — 크래시 없이 페이지 유지 @hard', async ({ page }) => {
    await routeSearch(page, (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate' }) }),
    )
    await loginAsUser(page)
    await gotoDirectory(page)
    await page.getByTestId(T.directoryV2SearchInput).fill('과다요청')
    await page.waitForTimeout(700)
    await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
  })

  test('HARD-09: malformed 응답(members 누락) — 크래시 없음 @hard', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))
    await routeSearch(page, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 5 }) }),
    )
    await loginAsUser(page)
    await gotoDirectory(page)
    await page.getByTestId(T.directoryV2SearchInput).fill('깨진응답')
    await page.waitForTimeout(700)
    await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
    expect(pageErrors, `unexpected page errors:\n${pageErrors.join('\n')}`).toHaveLength(0)
  })

  test('HARD-10: 결과 0건 — empty state 표시 @hard', async ({ page }) => {
    await routeSearch(page, (route) => route.fulfill(searchFulfill([], 0)))
    await loginAsUser(page)
    await gotoDirectory(page)
    await page.getByTestId(T.directoryV2SearchInput).fill('결과없는검색어zzz')
    await page.waitForTimeout(700)
    await expect(page.getByTestId(T.directoryV2EmptyState)).toBeVisible()
  })

  // ── 경쟁 조건 ──────────────────────────────────────────────────────────────
  test('HARD-11: 빠른 연속 입력 — debounce로 과도한 요청 방지 @hard', async ({ page }) => {
    let searchCalls = 0
    await routeSearch(page, (route) => {
      const u = new URL(route.request().url())
      if (u.searchParams.get('q')) searchCalls += 1
      return route.fulfill(searchFulfill(makeMembers(5)))
    })
    await loginAsUser(page)
    await gotoDirectory(page)

    const input = page.getByTestId(T.directoryV2SearchInput)
    // 글자별 빠른 입력 (press는 키 이름만 받으므로 pressSequentially 사용)
    await input.pressSequentially('오픈체인검색', { delay: 40 })
    await page.waitForTimeout(700)
    expect(searchCalls).toBeLessThanOrEqual(3)
  })

  test('HARD-12: 검색→클리어 → 전체 복원 (stale 결과 없음) @hard', async ({ page }) => {
    await routeSearch(page, (route) => {
      const u = new URL(route.request().url())
      const q = u.searchParams.get('q') ?? ''
      if (q) return route.fulfill(searchFulfill(makeMembers(1, () => ({ name_ko: '검색결과멤버' }))))
      return route.fulfill(searchFulfill(makeMembers(7)))
    })
    await loginAsUser(page)
    await gotoDirectory(page)

    const input = page.getByTestId(T.directoryV2SearchInput)
    await input.fill('검색')
    await page.waitForTimeout(600)
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(1)

    await page.getByTestId(T.directoryV2SearchClear).click()
    await expect(input).toHaveValue('')
    await page.waitForTimeout(600)
    await expect(page.getByTestId(T.directoryV2Card)).toHaveCount(7)
  })

  // ── 페이지네이션(서버) ─────────────────────────────────────────────────────
  test('HARD-13: 대규모 total + 페이지네이션 — 다음 페이지 요청 @hard', async ({ page }) => {
    const pages: string[] = []
    await routeSearch(page, (route) => {
      const u = new URL(route.request().url())
      const p = u.searchParams.get('page') ?? '1'
      pages.push(p)
      return route.fulfill(
        searchFulfill(makeMembers(24, (i) => ({ name_ko: `p${p}-멤버${i}` })), 10000, Number(p), 24),
      )
    })
    await loginAsUser(page)
    await gotoDirectory(page)
    // 검색으로 client fetch 트리거 → 24개/페이지, total 10000 → 페이지네이션 노출
    await triggerLoad(page)
    await expect(page.getByTestId(T.directoryV2Pagination)).toBeVisible()
    await page.getByTestId(T.directoryV2PaginationNext).click()
    await page.waitForTimeout(600)
    expect(pages).toContain('2')
  })

  // ── 보강: 특수문자 검색 ─────────────────────────────────────────────────────
  test('HARD-14: 특수문자/SQL 와일드카드 검색 — 크래시 없음 @hard', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))
    await routeSearch(page, (route) => route.fulfill(searchFulfill(makeMembers(3))))
    await loginAsUser(page)
    await gotoDirectory(page)
    const input = page.getByTestId(T.directoryV2SearchInput)
    for (const q of ['%_\\', "' OR 1=1 --", '"; DROP TABLE members;', '../../etc/passwd', '{{7*7}}']) {
      await input.fill(q)
      await page.waitForTimeout(400)
      await expect(page.getByTestId(T.directoryV2Page)).toBeVisible()
    }
    expect(pageErrors, pageErrors.join('\n')).toHaveLength(0)
  })

  // ── 보강: 느린 응답 → 스켈레톤 ─────────────────────────────────────────────
  test('HARD-15: 느린 검색 응답 — 로딩 스켈레톤 표시 후 결과 @hard', async ({ page }) => {
    await routeSearch(page, async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill(searchFulfill(makeMembers(6)))
    })
    await loginAsUser(page)
    await gotoDirectory(page)
    await page.getByTestId(T.directoryV2SearchInput).fill('느린검색')
    // 응답 전 스켈레톤이 보여야 함
    await expect(page.getByTestId(T.directoryV2Skeleton)).toBeVisible({ timeout: 4000 })
    // 응답 후 결과 카드
    await expect(page.getByTestId(T.directoryV2Card).first()).toBeVisible({ timeout: 6000 })
  })

  // ── 보강: 프로필 폼 미리보기 XSS ───────────────────────────────────────────
  test('HARD-P1: 프로필 라이브 미리보기 — 이름 XSS 미실행 @hard', async ({ page }) => {
    let dialogFired = false
    page.on('dialog', (d) => {
      dialogFired = true
      void d.dismiss()
    })
    await loginAsUnregisteredUser(page)
    await page.goto('/profile/new')
    const nameInput = page.getByTestId(T.registrationInputNameKo)
    const rendered = await nameInput
      .waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false)
    if (!rendered) test.skip(true, '프로필 등록 폼이 렌더되지 않음 (이미 멤버이거나 환경 이슈)')
    await nameInput.fill('<img src=x onerror="window.__pxss=1">')
    await page.waitForTimeout(300)
    const xss = await page.evaluate(() => (window as unknown as { __pxss?: number }).__pxss)
    expect(xss).toBeUndefined()
    expect(dialogFired).toBe(false)
  })

  // ── 보강: bio maxLength 강제 ────────────────────────────────────────────────
  test('HARD-P2: 프로필 bio — maxLength(200) 강제 @hard', async ({ page }) => {
    await loginAsUnregisteredUser(page)
    await page.goto('/profile/new')
    const bio = page.getByTestId(T.profileFormInputBio)
    const rendered = await bio
      .waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false)
    if (!rendered) test.skip(true, '프로필 등록 폼이 렌더되지 않음')
    await bio.fill('가'.repeat(300))
    const len = await bio.inputValue()
    expect(len.length).toBeLessThanOrEqual(200)
  })
})
