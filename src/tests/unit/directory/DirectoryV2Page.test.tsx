import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react'

import { NextIntlClientProvider } from 'next-intl'

import { DirectoryV2Page } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'
import type { Member } from '@/types/member'

function renderPage(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

function makeMember(partial: Partial<Member> & { id: string; name_ko: string }): Member {
  return {
    user_id: `u-${partial.id}`,
    name_en: undefined,
    company: 'Acme',
    role: undefined,
    bio: undefined,
    category: '기업',
    email: undefined,
    email_public: false,
    phone: undefined,
    phone_public: false,
    linkedin: undefined,
    github: undefined,
    discord: undefined,
    blog: undefined,
    avatar_url: undefined,
    tags: [],
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...partial,
  }
}

const initialMembers: Member[] = [
  makeMember({ id: 'm1', name_ko: '김오픈', company: 'Samsung', category: '기업' }),
  makeMember({ id: 'm2', name_ko: '박소스', company: 'ETRI', category: '연구/공공' }),
  makeMember({ id: 'm3', name_ko: '한미들', company: 'Hyundai', category: '기업' }),
]

describe('DirectoryV2Page (orchestrator)', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      const params = new URL(url, 'http://localhost').searchParams
      const q = params.get('q')?.toLowerCase() ?? ''
      const cat = params.get('category')
      let pool = initialMembers
      if (cat) pool = pool.filter((m) => m.category === cat)
      if (q)
        pool = pool.filter(
          (m) =>
            m.name_ko.toLowerCase().includes(q) ||
            m.company.toLowerCase().includes(q),
        )
      return new Response(
        JSON.stringify({
          members: pool,
          total: pool.length,
          page: 1,
          pageSize: 24,
          totalPages: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    cleanup()
  })

  it('초기 멤버 목록과 결과 카운트를 렌더링한다', () => {
    renderPage(
      <DirectoryV2Page
        initialMembers={initialMembers}
        initialTotal={initialMembers.length}
        isAuthenticated={true}
      />,
    )
    expect(screen.getByTestId(T.directoryV2Page)).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryV2Grid)).toBeInTheDocument()
    expect(screen.getAllByTestId(T.directoryV2Card)).toHaveLength(3)
    expect(screen.getByTestId(T.directoryV2ResultCount)).toHaveTextContent(
      '검색 결과 3명',
    )
  })

  it('검색어 입력 시 search API를 호출하고 결과를 갱신한다', async () => {
    vi.useFakeTimers()
    renderPage(
      <DirectoryV2Page
        initialMembers={initialMembers}
        initialTotal={initialMembers.length}
        isAuthenticated={true}
      />,
    )
    const input = screen.getByTestId(T.directoryV2SearchInput) as HTMLInputElement
    act(() => {
      fireEvent.change(input, { target: { value: 'Samsung' } })
    })
    // search bar debounce + page debounce
    act(() => {
      vi.advanceTimersByTime(700)
    })
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      const calls = (global.fetch as unknown as { mock: { calls: unknown[][] } })
        .mock.calls
      const url = String(calls[calls.length - 1][0])
      expect(url).toContain('/api/members/search')
      expect(url).toContain('q=Samsung')
    })
  })

  it('카테고리 chip 변경 시 search API를 호출한다', async () => {
    renderPage(
      <DirectoryV2Page
        initialMembers={initialMembers}
        initialTotal={initialMembers.length}
        isAuthenticated={true}
      />,
    )
    const filters = screen.getByTestId(T.directoryV2Filters)
    fireEvent.click(within(filters).getByRole('radio', { name: '연구/공공' }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
    await waitFor(() => {
      const calls = (global.fetch as unknown as { mock: { calls: unknown[][] } })
        .mock.calls
      const url = String(calls[calls.length - 1][0])
      expect(url).toContain('/api/members/search')
      expect(url).toContain('category=%EC%97%B0%EA%B5%AC%2F%EA%B3%B5%EA%B3%B5')
    })
  })

  it('비로그인일 때 검색·필터·결과 영역을 렌더링하지 않는다', () => {
    renderPage(
      <DirectoryV2Page
        initialMembers={[]}
        initialTotal={0}
        isAuthenticated={false}
        onGithubLogin={async () => undefined}
      />,
    )
    expect(screen.queryByTestId(T.directoryV2SearchInput)).not.toBeInTheDocument()
    expect(screen.queryByTestId(T.directoryV2Filters)).not.toBeInTheDocument()
    expect(screen.queryByTestId(T.directoryV2Grid)).not.toBeInTheDocument()
    // 비로그인 hero는 표시
    expect(screen.getByTestId(T.directoryV2HeroTitle)).toBeInTheDocument()
  })

  it('virtualize="on" 일 때 가상 그리드를 사용한다', () => {
    renderPage(
      <DirectoryV2Page
        initialMembers={initialMembers}
        initialTotal={initialMembers.length}
        isAuthenticated={true}
        virtualize="on"
      />,
    )
    expect(screen.getByTestId(T.directoryV2VirtualGrid)).toBeInTheDocument()
    expect(screen.queryByTestId(T.directoryV2Grid)).not.toBeInTheDocument()
  })
})
