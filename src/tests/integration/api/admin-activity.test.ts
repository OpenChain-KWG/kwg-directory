import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/admin', () => ({
  isAdminWithMfa: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  captureApiError: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { GET } from '@/app/api/admin/activity/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)

const ADMIN_USER_ID = 'admin-user-001'
const NON_ADMIN_ID = 'nonadmin-user-002'

const MOCK_ACTIVITY = [
  {
    id: 'log-1',
    action: 'member.approve',
    actor_id: ADMIN_USER_ID,
    target_type: 'member',
    target_id: 'm1',
    created_at: '2026-05-22T10:00:00Z',
  },
  {
    id: 'log-2',
    action: 'member.reject',
    actor_id: ADMIN_USER_ID,
    target_type: 'member',
    target_id: 'm2',
    created_at: '2026-05-21T10:00:00Z',
  },
]

function buildSupabaseMock(entries = MOCK_ACTIVITY) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: entries, error: null }),
    })),
  }
}

describe('GET /api/admin/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자: 401 응답', async () => {
    mockAuth.mockResolvedValue(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('비어드민 사용자: 403 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: NON_ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(false)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('어드민: 200 + 활동 로그 배열 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(Array.isArray(json.activity)).toBe(true)
    expect(json.activity).toHaveLength(2)
    expect(json.activity[0]).toMatchObject({
      id: 'log-1',
      action: 'member.approve',
      actor_id: ADMIN_USER_ID,
      target_type: 'member',
      target_id: 'm1',
    })
  })

  it('어드민: 데이터 없으면 빈 배열 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock([]) as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.activity).toEqual([])
  })

  it('어드민: DB 오류 시 500 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })),
    } as never)

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
