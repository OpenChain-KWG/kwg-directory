import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { DirectoryCommandMenu } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'

function renderMenu(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => pushMock(...args),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

describe('DirectoryCommandMenu', () => {
  beforeEach(() => {
    pushMock.mockReset()
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          members: [
            {
              id: 'm1',
              name_ko: '김오픈',
              company: 'Samsung',
              role: 'Engineer',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 8,
          totalPages: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('Cmd+K 단축키로 팔레트가 열린다', async () => {
    renderMenu(<DirectoryCommandMenu isAuthenticated={true} />)
    expect(screen.queryByTestId(T.directoryCommandMenuInput)).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
      )
    })

    expect(await screen.findByTestId(T.directoryCommandMenuInput)).toBeInTheDocument()
  })

  it('Ctrl+K (Win/Linux) 단축키로도 팔레트가 열린다', async () => {
    renderMenu(<DirectoryCommandMenu isAuthenticated={true} />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }),
      )
    })
    expect(await screen.findByTestId(T.directoryCommandMenuInput)).toBeInTheDocument()
  })

  it('인증된 사용자에게는 빠른 작업이 표시된다', async () => {
    renderMenu(
      <DirectoryCommandMenu
        isAuthenticated={true}
        isAdmin={true}
        onLogout={vi.fn()}
      />,
    )
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true }),
      )
    })
    expect(await screen.findByTestId(T.directoryCommandMenuEditProfile)).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryCommandMenuAdmin)).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryCommandMenuLogout)).toBeInTheDocument()
  })

  it('초기 open=true일 때 검색어 입력 시 search API를 호출한다', async () => {
    renderMenu(<DirectoryCommandMenu isAuthenticated={true} initialOpen={true} />)
    const input = await screen.findByTestId(T.directoryCommandMenuInput)
    fireEvent.change(input, { target: { value: 'Samsung' } })

    // Real-timer debounce는 200ms — 충분한 대기 시간 후 검사
    await new Promise((r) => setTimeout(r, 250))
    expect(global.fetch).toHaveBeenCalled()
    const calls = (global.fetch as unknown as { mock: { calls: unknown[][] } })
      .mock.calls
    const url = String(calls[calls.length - 1][0])
    expect(url).toContain('/api/members/search')
    expect(url).toContain('q=Samsung')
  })

  it('keydown listener는 unmount 시 해제된다', () => {
    const { unmount } = renderMenu(<DirectoryCommandMenu isAuthenticated={true} />)
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(
      removeSpy.mock.calls.some((c) => c[0] === 'keydown'),
    ).toBe(true)
  })
})
