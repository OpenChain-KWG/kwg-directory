import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { DirectorySearchBar } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'

function renderSearchBar(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('DirectorySearchBar', () => {
  it('placeholder와 search role을 노출한다', () => {
    renderSearchBar(<DirectorySearchBar value="" onChange={() => undefined} />)
    expect(screen.getByRole('search')).toBeInTheDocument()
    const input = screen.getByTestId(T.directoryV2SearchInput)
    expect(input).toHaveAttribute('aria-keyshortcuts', '/')
  })

  it('debounce 후 onChange가 호출된다', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    renderSearchBar(<DirectorySearchBar value="" onChange={onChange} />)
    const input = screen.getByTestId(T.directoryV2SearchInput) as HTMLInputElement
    act(() => {
      fireEvent.change(input, { target: { value: '오픈' } })
    })
    expect(onChange).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(310)
    })
    expect(onChange).toHaveBeenCalledWith('오픈')
  })

  it('값이 있으면 초기화 버튼이 표시되고 클릭하면 비워진다', async () => {
    const onChange = vi.fn()
    renderSearchBar(<DirectorySearchBar value="open" onChange={onChange} debounceMs={0} />)
    const clear = screen.getByTestId(T.directoryV2SearchClear)
    fireEvent.click(clear)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  it('/ 키를 누르면 input에 포커스가 이동한다', () => {
    renderSearchBar(<DirectorySearchBar value="" onChange={() => undefined} />)
    const input = screen.getByTestId(T.directoryV2SearchInput)
    expect(input).not.toHaveFocus()
    act(() => {
      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
      window.dispatchEvent(event)
    })
    expect(input).toHaveFocus()
  })
})
