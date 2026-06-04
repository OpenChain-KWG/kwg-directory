import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotRegisteredScreen from '@/components/NotRegisteredScreen'

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

describe('NotRegisteredScreen', () => {
  it('data-testid가 올바르게 렌더링된다', () => {
    render(<NotRegisteredScreen />)
    expect(screen.getByTestId('not-registered-screen')).toBeInTheDocument()
  })

  it('미등록 안내 텍스트가 표시된다', () => {
    render(<NotRegisteredScreen />)
    expect(screen.getByText('OpenChain KWG 멤버 소개')).toBeInTheDocument()
    expect(screen.getByText(/프로필을 등록해주세요/)).toBeInTheDocument()
    expect(screen.getByText(/관리자 승인을 거쳐/)).toBeInTheDocument()
  })

  it('프로필 등록하기 링크가 /profile/new로 연결된다', () => {
    render(<NotRegisteredScreen />)
    const link = screen.getByRole('link', { name: '프로필 등록하기' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/profile/new')
  })

  it('KWG 로고 이미지가 표시된다', () => {
    render(<NotRegisteredScreen />)
    expect(screen.getByAltText('OpenChain Korea Work Group')).toBeInTheDocument()
  })
})
