import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'

import AdminTabs from '@/components/AdminTabs'
import { Member } from '@/types/member'
import type { AdminInfo } from '@/components/AdminManagement'
import koMessages from '../../../messages/ko.json'

vi.mock('@/components/admin/PendingMembersTable', () => ({
  default: ({ initialPending }: { initialPending: Member[] }) => (
    <div data-testid="admin-table">승인대기:{initialPending.length}</div>
  ),
}))

vi.mock('@/components/AdminManagement', () => ({
  default: ({ initialAdmins }: { initialAdmins: AdminInfo[] }) => (
    <div data-testid="admin-management">어드민:{initialAdmins.length}</div>
  ),
}))

vi.mock('@/components/admin/ActivityFeed', () => ({
  default: () => <div data-testid="admin-activity-feed">활동</div>,
}))

const mockPending: Member[] = [
  {
    id: 'uuid-1',
    user_id: 'user-1',
    name_ko: '홍길동',
    company: '테스트기업',
    approved: false,
    email_public: false,
    phone_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockAdmins: AdminInfo[] = [
  { user_id: 'admin-1', name_ko: '관리자', avatar_url: null, added_at: '2024-01-01T00:00:00Z' },
]

const mockApproved = [{ user_id: 'user-1', name_ko: '홍길동', company: '테스트', avatar_url: undefined }]

function renderTabs(props: Partial<React.ComponentProps<typeof AdminTabs>> = {}) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      <AdminTabs
        initialPending={mockPending}
        initialAdmins={mockAdmins}
        approvedMembers={mockApproved}
        currentUserId="admin-1"
        {...props}
      />
    </NextIntlClientProvider>,
  )
}

describe('AdminTabs', () => {
  it('초기 탭: 승인 대기 탭이 활성화되고 PendingMembersTable이 렌더된다', () => {
    renderTabs()
    expect(screen.getByTestId('admin-table')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-management')).not.toBeInTheDocument()
  })

  it('대기 인원이 있을 때 배지 숫자가 표시된다', () => {
    renderTabs()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('어드민 관리 탭 클릭 → AdminManagement가 렌더된다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: /어드민 관리/ }))

    expect(screen.getByTestId('admin-management')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-table')).not.toBeInTheDocument()
  })

  it('활동 내역 탭 클릭 → ActivityFeed가 렌더된다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: /활동 내역/ }))

    expect(screen.getByTestId('admin-activity-feed')).toBeInTheDocument()
  })

  it('승인 대기 탭 클릭 → 다시 PendingMembersTable이 렌더된다', async () => {
    const user = userEvent.setup()
    renderTabs()

    await user.click(screen.getByRole('tab', { name: /어드민 관리/ }))
    await user.click(screen.getByRole('tab', { name: /승인 대기/ }))

    expect(screen.getByTestId('admin-table')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-management')).not.toBeInTheDocument()
  })

  it('대기 인원 0명이면 배지가 표시되지 않는다', () => {
    renderTabs({ initialPending: [] })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
