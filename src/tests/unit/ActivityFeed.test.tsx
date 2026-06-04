import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import ActivityFeed from '@/components/admin/ActivityFeed'
import type { ActivityLogEntry } from '@/components/admin/ActivityFeed'
import koMessages from '../../../messages/ko.json'

function renderFeed(props: React.ComponentProps<typeof ActivityFeed>) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      <ActivityFeed {...props} />
    </NextIntlClientProvider>,
  )
}

const entry = (over: Partial<ActivityLogEntry> = {}): ActivityLogEntry => ({
  id: 'log-1',
  action: 'member.approve',
  actor_id: 'admin-1',
  target_type: 'member',
  target_id: 'm1',
  created_at: new Date().toISOString(),
  ...over,
})

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initialEntries로 활동 항목을 렌더한다', () => {
    renderFeed({ initialEntries: [entry({ action: 'member.approve' }), entry({ id: 'log-2', action: 'member.reject' })] })

    expect(screen.getByTestId('admin-activity-feed')).toBeInTheDocument()
    expect(screen.getAllByTestId('admin-activity-item')).toHaveLength(2)
    expect(screen.getByText('멤버 승인')).toBeInTheDocument()
    expect(screen.getByText('멤버 거절')).toBeInTheDocument()
  })

  it('빈 배열이면 EmptyState를 렌더한다', () => {
    renderFeed({ initialEntries: [] })
    expect(screen.getByText('활동 내역이 없습니다')).toBeInTheDocument()
  })

  it('알 수 없는 action은 fallback 라벨을 사용한다', () => {
    renderFeed({ initialEntries: [entry({ action: 'unknown.event' })] })
    expect(screen.getByText('기타 활동')).toBeInTheDocument()
  })

  it('initialEntries 미지정 시 API에서 활동을 가져온다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ activity: [entry({ action: 'admin.add' })] }), { status: 200 }),
    )
    renderFeed({})
    await waitFor(() => expect(screen.getByText('어드민 추가')).toBeInTheDocument())
  })

  it('API 실패 시 loadError를 표시한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 500 }))
    renderFeed({})
    await waitFor(() => expect(screen.getByText('활동 내역을 불러오지 못했습니다.')).toBeInTheDocument())
  })
})
