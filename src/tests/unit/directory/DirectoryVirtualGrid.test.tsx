import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { type ReactElement } from 'react'

import { DirectoryVirtualGrid } from '@/components/directory'
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

// Provide a deterministic ResizeObserver for jsdom — emit a single layout call.
class FakeResizeObserver {
  callback: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb
  }
  observe() {
    /* trigger callback synchronously to flush column derivation */
    this.callback([], this)
  }
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof FakeResizeObserver }).ResizeObserver =
  FakeResizeObserver

function makeMember(id: string): Member {
  return {
    id,
    user_id: `u-${id}`,
    name_ko: `name-${id}`,
    company: 'Acme',
    email_public: false,
    phone_public: false,
    approved: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    tags: [],
  } as Member
}

function renderGrid(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('DirectoryVirtualGrid', () => {
  afterEach(() => {
    cleanup()
  })

  it('가상 그리드 wrapper와 카드들을 렌더링한다', () => {
    const members = Array.from({ length: 12 }, (_, i) => makeMember(`m${i}`))
    renderGrid(<DirectoryVirtualGrid members={members} />)
    expect(screen.getByTestId(T.directoryV2VirtualGrid)).toBeInTheDocument()
    // overscan은 환경에 따라 다르지만, 최소 1개 이상의 row와 cell이 보장됨.
    expect(screen.getAllByTestId(T.directoryV2VirtualRow).length).toBeGreaterThan(0)
    expect(screen.getAllByTestId(T.directoryV2VirtualCell).length).toBeGreaterThan(0)
  })

  it('빈 멤버 목록일 때 카드를 렌더링하지 않는다', () => {
    renderGrid(<DirectoryVirtualGrid members={[]} />)
    expect(screen.queryAllByTestId(T.directoryV2VirtualCell)).toHaveLength(0)
  })
})
