import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import {
  DirectoryListProvider,
  MemberDetailSheet,
} from '@/components/directory'
import { T } from '../../../../e2e/helpers/testIds'
import koMessages from '../../../../messages/ko.json'
import type { Member } from '@/types/member'

function renderSheet(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

const replaceMock = vi.fn()
const backMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: (...args: unknown[]) => replaceMock(...args),
    back: (...args: unknown[]) => backMock(...args),
  }),
}))

function makeMember(partial: Partial<Member> & { id: string; name_ko: string }): Member {
  return {
    user_id: `u-${partial.id}`,
    company: 'Acme',
    email_public: false,
    phone_public: false,
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: [],
    ...partial,
  } as Member
}

const m1 = makeMember({ id: 'a', name_ko: '에이' })
const m2 = makeMember({ id: 'b', name_ko: '비' })
const m3 = makeMember({ id: 'c', name_ko: '씨' })

describe('MemberDetailSheet', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    backMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('기본 정보가 렌더링되고 sheet 제목·테스트ID가 노출된다', () => {
    renderSheet(<MemberDetailSheet member={m1} />)
    expect(screen.getByTestId(T.memberDetailSheet)).toBeInTheDocument()
    expect(screen.getByTestId(T.memberDetailSheetTitle)).toHaveTextContent('에이')
  })

  it('첫 멤버에서 prev 버튼은 disabled, next는 enabled', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m1} />
      </DirectoryListProvider>,
    )
    expect(screen.getByTestId(T.memberDetailPrevBtn)).toBeDisabled()
    expect(screen.getByTestId(T.memberDetailNextBtn)).not.toBeDisabled()
  })

  it('마지막 멤버에서 next 버튼은 disabled', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m3} />
      </DirectoryListProvider>,
    )
    expect(screen.getByTestId(T.memberDetailNextBtn)).toBeDisabled()
  })

  it('→ 키 입력 시 다음 멤버로 router.replace 호출', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m1} />
      </DirectoryListProvider>,
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })
    expect(replaceMock).toHaveBeenCalledWith(`/members/${m2.id}`)
  })

  it('← 키 입력 시 이전 멤버로 router.replace 호출', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m2} />
      </DirectoryListProvider>,
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(replaceMock).toHaveBeenCalledWith(`/members/${m1.id}`)
  })

  it('첫 멤버에서 ← 키는 무시된다', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m1} />
      </DirectoryListProvider>,
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    })
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('next 버튼 클릭 시 router.replace 호출', () => {
    renderSheet(
      <DirectoryListProvider ids={[m1.id, m2.id, m3.id]}>
        <MemberDetailSheet member={m2} />
      </DirectoryListProvider>,
    )
    fireEvent.click(screen.getByTestId(T.memberDetailNextBtn))
    expect(replaceMock).toHaveBeenCalledWith(`/members/${m3.id}`)
  })

  it('이메일이 노출된 경우 mailto 링크 표시', () => {
    const m = makeMember({
      id: 'x',
      name_ko: '엑스',
      email: 'x@example.com',
      email_public: true,
    })
    renderSheet(<MemberDetailSheet member={m} />)
    const link = screen.getByRole('link', { name: /x@example\.com/ })
    expect(link).toHaveAttribute('href', 'mailto:x@example.com')
  })
})
