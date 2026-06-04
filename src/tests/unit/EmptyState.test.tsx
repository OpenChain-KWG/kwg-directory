import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '@/components/EmptyState'

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('EmptyState', () => {
  it('title을 렌더링한다', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="검색 결과가 없습니다."
      />
    )
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('description이 있으면 표시한다', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="제목"
        description="설명 텍스트"
      />
    )
    expect(screen.getByText('설명 텍스트')).toBeInTheDocument()
  })

  it('action이 있으면 링크 버튼을 표시한다', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="제목"
        action={{ label: '프로필 등록하기', href: '/profile/new' }}
      />
    )
    const link = screen.getByRole('link', { name: '프로필 등록하기' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/profile/new')
  })

  it('onReset이 있으면 초기화 버튼을 표시한다', async () => {
    const onReset = vi.fn()
    render(
      <EmptyState
        icon={<svg />}
        title="제목"
        onReset={onReset}
        resetLabel="필터 초기화"
      />
    )
    const btn = screen.getByRole('button', { name: '필터 초기화' })
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('action과 onReset이 없으면 버튼/링크가 없다', () => {
    render(<EmptyState icon={<svg />} title="제목" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
