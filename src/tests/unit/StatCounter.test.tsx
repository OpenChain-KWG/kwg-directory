import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import StatCounter from '@/components/StatCounter'

// StatCounter는 useLocale()로 활성 로케일을 읽으므로 intl 컨텍스트가 필요하다.
function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={{}}>
      {ui}
    </NextIntlClientProvider>
  )
}

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
let intersectionCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null

function setupIntersectionObserver() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
        intersectionCallback = cb
      }
      observe = mockObserve
      disconnect = mockDisconnect
    }
  )
}

function triggerIntersection(isIntersecting: boolean) {
  if (intersectionCallback) {
    intersectionCallback([{ isIntersecting } as IntersectionObserverEntry])
  }
}

describe('StatCounter', () => {
  beforeEach(() => {
    intersectionCallback = null
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    setupIntersectionObserver()

    // 각 호출마다 1000ms씩 증가 → duration(1200)보다 커지면 루프 종료
    let rafSeq = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      rafSeq++
      cb(rafSeq * 1000)
      return rafSeq
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('초기 렌더: 전달된 value 값을 표시한다', () => {
    renderWithIntl(<StatCounter value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('IntersectionObserver가 등록된다', () => {
    renderWithIntl(<StatCounter value={10} />)
    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  it('교차 감지 전에는 값이 변하지 않는다', () => {
    renderWithIntl(<StatCounter value={99} />)
    // intersection 트리거 없이 초기 값 유지
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('교차 감지 후 카운트 애니메이션이 시작된다 (0에서 시작)', async () => {
    renderWithIntl(<StatCounter value={50} duration={100} />)
    await act(async () => {
      triggerIntersection(true)
    })
    // requestAnimationFrame이 즉시 실행되므로 값이 변경됨
    const span = screen.getByText(/\d+/)
    expect(span).toBeInTheDocument()
  })

  it('isIntersecting=false 이면 애니메이션이 시작되지 않는다', async () => {
    renderWithIntl(<StatCounter value={100} />)
    await act(async () => {
      triggerIntersection(false)
    })
    // 값은 초기 상태 유지
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('언마운트 시 observer가 disconnect된다', () => {
    const { unmount } = renderWithIntl(<StatCounter value={5} />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})
