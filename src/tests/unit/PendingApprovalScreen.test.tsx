import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import PendingApprovalScreen from '@/components/PendingApprovalScreen'
import koMessages from '../../../messages/ko.json'

function renderScreen(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

const DEFAULT_PROPS = {
  name: '홍길동',
  createdAt: '2026-04-01T00:00:00Z',
}

describe('PendingApprovalScreen', () => {
  it('data-testid가 올바르게 렌더링된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(screen.getByTestId('pending-approval-screen')).toBeInTheDocument()
  })

  it('이름과 운영진 검토 안내 텍스트가 표시된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(screen.getByText(/안녕하세요, 홍길동님/)).toBeInTheDocument()
    expect(screen.getByText(/운영진 검토 중/)).toBeInTheDocument()
    expect(screen.getByText(/1~2 영업일/)).toBeInTheDocument()
  })

  it('신청일이 포맷에 맞게 표시된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(screen.getByText(/신청일: 2026년 4월 1일/)).toBeInTheDocument()
  })

  it('프로필 수정하기 링크가 /profile/edit으로 연결된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    const link = screen.getByRole('link', { name: '프로필 수정하기' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/profile/edit')
  })

  it('신청 취소 버튼이 표시된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: '신청 취소' })).toBeInTheDocument()
  })

  it('문의 이메일 링크가 표시된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(
      screen.getByRole('link', { name: 'korea-sg-planning@lists.openchainproject.org' })
    ).toBeInTheDocument()
  })

  it('KWG 로고 이미지가 표시된다', () => {
    renderScreen(<PendingApprovalScreen {...DEFAULT_PROPS} />)
    expect(screen.getByAltText('OpenChain Korea Work Group')).toBeInTheDocument()
  })
})
