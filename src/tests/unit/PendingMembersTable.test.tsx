import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import type { RowSelectionState } from '@tanstack/react-table'

import PendingMembersTable from '@/components/admin/PendingMembersTable'
import { Member } from '@/types/member'
import koMessages from '../../../messages/ko.json'

// next/image → plain img (jsdom)
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// DataTable is a dynamically-imported (ssr:false) TanStack table. Stub it so
// the unit test focuses on PendingMembersTable's own logic: action cells,
// row click, and the selection callback that drives the bulk bar.
vi.mock('@/components/patterns', async () => {
  const actual = await vi.importActual<typeof import('@/components/patterns')>(
    '@/components/patterns',
  )
  return {
    ...actual,
    DataTable: <TData,>({
      data,
      columns,
      onSelectionChange,
      onRowClick,
      emptyTitle,
    }: {
      data: TData[]
      columns: Array<{ id?: string; cell?: (ctx: { row: { original: TData; index: number } }) => React.ReactNode }>
      onSelectionChange?: (s: RowSelectionState) => void
      onRowClick?: (row: TData) => void
      emptyTitle?: React.ReactNode
    }) => {
      const nameCol = columns.find((c) => c.id === 'name')
      const actionCol = columns.find((c) => c.id === 'actions')
      if (data.length === 0) return <div>{emptyTitle}</div>
      return (
        <div>
          {data.map((row, index) => (
            <div key={index} data-testid="stub-row">
              <button type="button" onClick={() => onRowClick?.(row)}>
                {nameCol?.cell?.({ row: { original: row, index } }) ?? `row-${index}`}
              </button>
              <input
                type="checkbox"
                aria-label={`select-${index}`}
                onChange={(e) =>
                  onSelectionChange?.(e.target.checked ? { [index]: true } : {})
                }
              />
              {actionCol?.cell?.({ row: { original: row, index } })}
            </div>
          ))}
        </div>
      )
    },
  }
})

const member = (over: Partial<Member> = {}): Member => ({
  id: 'm1',
  user_id: 'u1',
  name_ko: '홍길동',
  company: '테스트기업',
  approved: false,
  email_public: false,
  phone_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...over,
})

function renderTable(initialPending: Member[]) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      <PendingMembersTable initialPending={initialPending} />
    </NextIntlClientProvider>,
  )
}

describe('PendingMembersTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('admin-table 컨테이너와 멤버 이름·액션 버튼을 렌더한다', () => {
    renderTable([member({ id: 'm1', name_ko: 'E2E테스트멤버' })])
    expect(screen.getByTestId('admin-table')).toBeInTheDocument()
    expect(screen.getByText('E2E테스트멤버')).toBeInTheDocument()

    const actionArea = document.querySelector('[data-member-id="m1"]') as HTMLElement
    expect(actionArea).toBeInTheDocument()
    expect(within(actionArea).getByRole('button', { name: '승인' })).toBeInTheDocument()
    expect(within(actionArea).getByRole('button', { name: '거절' })).toBeInTheDocument()
  })

  it('승인 클릭 → approve API 호출 후 목록에서 제거된다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ inviteStatus: 'skipped' }), { status: 200 }),
      )
    const user = userEvent.setup()
    renderTable([member({ id: 'm1', name_ko: 'E2E테스트멤버' })])

    const actionArea = document.querySelector('[data-member-id="m1"]') as HTMLElement
    await user.click(within(actionArea).getByRole('button', { name: '승인' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/approve',
      expect.objectContaining({ method: 'POST' }),
    )
    await waitFor(() =>
      expect(screen.queryByText('E2E테스트멤버')).not.toBeInTheDocument(),
    )
  })

  it('거절 클릭 → 거절 사유 입력 모달 + 네이티브 select(가입 자격 미해당) + 거절 확정 → 제거', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    const user = userEvent.setup()
    renderTable([member({ id: 'm1', name_ko: 'E2E테스트멤버' })])

    const actionArea = document.querySelector('[data-member-id="m1"]') as HTMLElement
    await user.click(within(actionArea).getByRole('button', { name: '거절' }))

    // 거절 사유 입력 텍스트 노출
    expect(await screen.findAllByText('거절 사유 입력')).not.toHaveLength(0)

    // 네이티브 select(role=combobox)에서 '가입 자격 미해당' 선택
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, '가입 자격 미해당')

    await user.click(screen.getByRole('button', { name: '거절 확정' }))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/reject',
      expect.objectContaining({ method: 'POST' }),
    )
    await waitFor(() =>
      expect(screen.queryByText('E2E테스트멤버')).not.toBeInTheDocument(),
    )
  })

  it('행 선택 시 벌크 액션 바가 노출된다', async () => {
    const user = userEvent.setup()
    renderTable([member({ id: 'm1' }), member({ id: 'm2', name_ko: '김철수' })])

    expect(screen.queryByTestId('admin-bulk-bar')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('select-0'))

    const bar = await screen.findByTestId('admin-bulk-bar')
    expect(bar).toBeInTheDocument()
    expect(within(bar).getByTestId('admin-bulk-approve-btn')).toBeInTheDocument()
    expect(within(bar).getByTestId('admin-bulk-reject-btn')).toBeInTheDocument()
  })

  it('빈 목록이면 emptyTitle을 렌더한다', () => {
    renderTable([])
    expect(screen.getByText('승인 대기 중인 멤버가 없습니다.')).toBeInTheDocument()
  })
})
