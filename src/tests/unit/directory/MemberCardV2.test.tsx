import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { type ReactElement } from 'react'

import { MemberCardV2 } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import type { Member } from '@/types/member'
import koMessages from '../../../../messages/ko.json'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

const baseMember: Member = {
  id: 'mem-1',
  user_id: 'gh-1',
  name_ko: '김오픈',
  name_en: 'Open Kim',
  company: 'Samsung',
  role: 'OSPM',
  category: '기업',
  email_public: false,
  phone_public: false,
  linkedin: 'https://linkedin.com/in/openkim',
  github: 'openkim',
  tags: ['SPDX', 'Compliance', 'Tooling', 'Education'],
  approved: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function renderCard(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('MemberCardV2', () => {
  it('이름·소속·역할을 렌더링한다', () => {
    renderCard(<MemberCardV2 member={baseMember} />)
    expect(screen.getByText('김오픈')).toBeInTheDocument()
    expect(screen.getByText('Open Kim')).toBeInTheDocument()
    expect(screen.getByText('Samsung')).toBeInTheDocument()
    expect(screen.getByText('OSPM')).toBeInTheDocument()
  })

  it('카드 자체가 /members/[id] 로 이동하는 링크다', () => {
    renderCard(<MemberCardV2 member={baseMember} />)
    const card = screen.getByTestId(T.directoryV2Card)
    expect(card.tagName).toBe('A')
    expect(card).toHaveAttribute('href', '/members/mem-1')
  })

  it('aria-label에 멤버 이름이 포함된다', () => {
    renderCard(<MemberCardV2 member={baseMember} />)
    expect(
      screen.getByRole('link', { name: /김오픈/ }),
    ).toBeInTheDocument()
  })

  it('태그는 최대 3개만 표시하고 나머지는 +N 배지로 노출한다', () => {
    renderCard(<MemberCardV2 member={baseMember} />)
    expect(screen.getByText('SPDX')).toBeInTheDocument()
    expect(screen.getByText('Compliance')).toBeInTheDocument()
    expect(screen.getByText('Tooling')).toBeInTheDocument()
    expect(screen.queryByText('Education')).not.toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('SNS 항목이 있으면 보유 표식을 노출한다', () => {
    renderCard(<MemberCardV2 member={baseMember} />)
    expect(screen.getByLabelText(/LinkedIn 보유/)).toBeInTheDocument()
    expect(screen.getByLabelText(/GitHub 보유/)).toBeInTheDocument()
  })

  it('SNS 항목이 모두 없으면 보유 표식 영역이 렌더링되지 않는다', () => {
    renderCard(
      <MemberCardV2
        member={{
          ...baseMember,
          linkedin: undefined,
          github: undefined,
          discord: undefined,
          blog: undefined,
        }}
      />,
    )
    expect(screen.queryByLabelText(/보유/)).not.toBeInTheDocument()
  })
})
