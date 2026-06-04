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

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { GET } from '@/app/api/admin/members/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)

describe('관리자 API 인증 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 상태에서 /api/admin/members 접근 시 401 반환', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('admin 테이블에 없는 유저가 /api/admin/members 접근 시 403 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'non-admin-user' } } as never)
    mockIsAdmin.mockResolvedValue(false)

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('admin 유저는 pending 멤버 목록을 조회할 수 있다', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-user' } } as never)
    mockIsAdmin.mockResolvedValue(true)

    const pendingMembers = [
      { id: 'uuid-1', name_ko: '대기중', company: '테스트', approved: false },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: pendingMembers, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].name_ko).toBe('대기중')
  })
})
