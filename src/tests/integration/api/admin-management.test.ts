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
vi.mock('@/lib/audit', () => ({ auditLog: vi.fn().mockResolvedValue(undefined) }))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { GET, PATCH } from '@/app/api/admin/admins/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)

const ADMIN_USER_ID = 'b0000000-0000-4000-8000-000000000010'
const OTHER_ADMIN_ID = 'b0000000-0000-4000-8000-000000000020'
const MEMBER_USER_ID = 'b0000000-0000-4000-8000-000000000030'
const NON_ADMIN_ID = 'b0000000-0000-4000-8000-000000000040'

function buildSupabaseMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('GET /api/admin/admins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자: 401 응답', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockIsAdmin.mockResolvedValue(false)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

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

  it('어드민: 어드민 목록 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)

    // admins 쿼리: select().order() 형태
    const adminsChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { user_id: ADMIN_USER_ID, added_at: '2024-01-01T00:00:00Z' },
          { user_id: OTHER_ADMIN_ID, added_at: '2024-02-01T00:00:00Z' },
        ],
        error: null,
      }),
    }
    // members 쿼리: select().in() 형태
    const membersChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { user_id: ADMIN_USER_ID, name_ko: '홍길동', avatar_url: null },
          { user_id: OTHER_ADMIN_ID, name_ko: '김철수', avatar_url: null },
        ],
        error: null,
      }),
    }
    const fromMock = vi.fn()
      .mockReturnValueOnce(adminsChain)
      .mockReturnValueOnce(membersChain)
    mockCreateAdminClient.mockReturnValue({ from: fromMock } as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].name_ko).toBe('홍길동')
  })
})

describe('PATCH /api/admin/admins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비어드민 호출: 403 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: NON_ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(false)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const req = new Request('http://localhost/api/admin/admins', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'add', user_id: MEMBER_USER_ID }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  it('어드민이 다른 멤버를 어드민으로 추가', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)

    const { chain, ...supabase } = buildSupabaseMock()
    // members 조회 (approved=true 확인)
    chain.single.mockResolvedValueOnce({
      data: { user_id: MEMBER_USER_ID, approved: true },
      error: null,
    })
    // admins insert
    chain.insert.mockReturnThis()
    chain.order.mockResolvedValueOnce({ data: null, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const req = new Request('http://localhost/api/admin/admins', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'add', user_id: MEMBER_USER_ID }),
    })
    const res = await PATCH(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.action).toBe('added')
  })

  it('어드민이 다른 어드민을 제거', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)

    // count 쿼리: from('admins').select(..., { head: true }) → select가 직접 resolve
    const countChain = {
      select: vi.fn().mockResolvedValue({ count: 2, error: null }),
    }
    // delete 쿼리: from('admins').delete().eq(...)
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    const fromMock = vi.fn()
      .mockReturnValueOnce(countChain)
      .mockReturnValue(deleteChain)
    mockCreateAdminClient.mockReturnValue({ from: fromMock } as never)

    const req = new Request('http://localhost/api/admin/admins', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'remove', user_id: OTHER_ADMIN_ID }),
    })
    const res = await PATCH(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.action).toBe('removed')
  })

  it('본인 제거 시도: 400 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const req = new Request('http://localhost/api/admin/admins', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'remove', user_id: ADMIN_USER_ID }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('본인')
  })

  it('마지막 어드민 제거 시도: 400 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)

    const countChain = {
      select: vi.fn().mockResolvedValue({ count: 1, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => countChain) } as never)

    const req = new Request('http://localhost/api/admin/admins', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'remove', user_id: OTHER_ADMIN_ID }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('마지막')
  })
})
