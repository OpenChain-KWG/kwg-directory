import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { type ReactElement } from 'react'

import { DirectoryHero } from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'

function renderHero(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('DirectoryHero', () => {
  it('비로그인일 때 KWG Members hero를 렌더링한다', () => {
    renderHero(
      <DirectoryHero
        isAuthenticated={false}
        totalCount={7}
        onGithubLogin={async () => undefined}
        onGoogleLogin={async () => undefined}
      />,
    )
    expect(screen.getByTestId(T.directoryV2Hero)).toBeInTheDocument()
    expect(screen.getByTestId(T.directoryV2HeroTitle)).toHaveTextContent(
      'OpenChain KWG Members',
    )
    expect(screen.getByRole('button', { name: /GitHub로 로그인/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '개인정보 처리방침' })).toBeInTheDocument()
    // #4 신뢰/보안 신호 + 멤버 수 티저
    expect(screen.getByText('운영진 승인을 거친 7명의 멤버')).toBeInTheDocument()
    expect(screen.getByText('이메일은 본인이 공개한 경우 승인된 멤버에게만 보입니다')).toBeInTheDocument()
    expect(screen.getByText('운영진 승인을 거친 멤버만 게재됩니다')).toBeInTheDocument()
    expect(screen.getByText('개인정보보호법(PIPA)을 준수합니다')).toBeInTheDocument()
  })

  it('로그인 상태에서는 멤버 소개 헤더만 렌더링한다', () => {
    renderHero(<DirectoryHero isAuthenticated={true} totalCount={42} />)
    expect(screen.getByTestId(T.directoryV2HeroTitle)).toHaveTextContent('멤버 소개')
    expect(screen.queryByRole('button', { name: /로그인/ })).not.toBeInTheDocument()
    expect(screen.getByText('현재 42명')).toBeInTheDocument()
  })

  it('로그인 상태에서 totalCount가 0이면 카운트 노출을 생략한다', () => {
    renderHero(<DirectoryHero isAuthenticated={true} totalCount={0} />)
    expect(screen.queryByText(/현재 \d+명/)).not.toBeInTheDocument()
  })
})
