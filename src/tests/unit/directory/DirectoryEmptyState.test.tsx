import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { type ReactElement } from 'react'

import { DirectoryEmptyState } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'

function renderEmpty(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('DirectoryEmptyState', () => {
  it('기본 카피와 reset 버튼을 렌더링한다', () => {
    renderEmpty(<DirectoryEmptyState onReset={() => undefined} />)
    expect(screen.getByTestId(T.directoryV2EmptyState)).toBeInTheDocument()
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
    expect(screen.getByText('다른 키워드 또는 분류를 시도해 보세요.')).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryV2EmptyReset)).toBeInTheDocument()
  })

  it('reset 버튼 클릭 시 onReset이 호출된다', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    renderEmpty(<DirectoryEmptyState onReset={onReset} />)
    await user.click(screen.getByTestId(T.directoryV2EmptyReset))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('title/description override를 지원한다', () => {
    renderEmpty(
      <DirectoryEmptyState
        onReset={() => undefined}
        title="커스텀 제목"
        description="커스텀 설명"
        resetLabel="다시 시도"
      />,
    )
    expect(screen.getByText('커스텀 제목')).toBeInTheDocument()
    expect(screen.getByText('커스텀 설명')).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryV2EmptyReset)).toHaveTextContent('다시 시도')
  })
})
