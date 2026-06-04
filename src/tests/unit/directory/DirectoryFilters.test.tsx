import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'

import { ALL_FILTER, DirectoryFilters } from '@/components/directory'
import koMessages from '../../../../messages/ko.json'

function renderFilters(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('DirectoryFilters', () => {
  it('전체 + 전달된 카테고리를 chip으로 렌더링한다', () => {
    renderFilters(
      <DirectoryFilters
        categories={['기업', '연구/공공']}
        category={ALL_FILTER}
        onCategoryChange={() => undefined}
        sort="name"
        onSortChange={() => undefined}
      />,
    )
    const group = screen.getByRole('radiogroup')
    expect(within(group).getByRole('radio', { name: '전체' })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: '기업' })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: '연구/공공' })).toBeInTheDocument()
  })

  it('chip 클릭 시 onCategoryChange를 호출한다', async () => {
    const user = userEvent.setup()
    const onCategoryChange = vi.fn()
    renderFilters(
      <DirectoryFilters
        categories={['기업', '연구/공공']}
        category={ALL_FILTER}
        onCategoryChange={onCategoryChange}
        sort="name"
        onSortChange={() => undefined}
      />,
    )
    await user.click(screen.getByRole('radio', { name: '기업' }))
    expect(onCategoryChange).toHaveBeenCalledWith('기업')
  })

  it('선택된 chip은 aria-checked=true를 가진다', () => {
    renderFilters(
      <DirectoryFilters
        categories={['기업', '연구/공공']}
        category="기업"
        onCategoryChange={() => undefined}
        sort="name"
        onSortChange={() => undefined}
      />,
    )
    const selected = screen.getByRole('radio', { name: '기업' })
    expect(selected).toHaveAttribute('aria-checked', 'true')
    const all = screen.getByRole('radio', { name: '전체' })
    expect(all).toHaveAttribute('aria-checked', 'false')
  })
})
