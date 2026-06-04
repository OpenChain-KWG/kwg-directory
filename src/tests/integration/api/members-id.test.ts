import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { GET, PATCH, DELETE } from '@/app/api/members/[id]/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)

const mockMember = {
  id: 'uuid-1',
  user_id: 'github-001',
  name_ko: '홍길동',
  company: 'SK텔레콤',
  email: 'test@skt.com',
  email_public: true,
  approved: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function buildChain(singleResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult),
  }
  return { supabase: { from: vi.fn(() => chain) }, chain }
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/members/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('존재하는 승인된 멤버 → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase } = buildChain({ data: mockMember, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost'), makeParams('uuid-1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name_ko).toBe('홍길동')
  })

  it('없는 ID → 404', async () => {
    mockAuth.mockResolvedValue(null as never)
    const { supabase } = buildChain({ data: null, error: { message: 'not found' } })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost'), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('비로그인 사용자: email_public=true여도 email null', async () => {
    mockAuth.mockResolvedValue(null as never)
    const { supabase } = buildChain({ data: mockMember, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost'), makeParams('uuid-1'))
    const json = await res.json()
    expect(json.email).toBeNull()
  })

  it('로그인 사용자 + email_public=true → email 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase } = buildChain({ data: mockMember, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost'), makeParams('uuid-1'))
    const json = await res.json()
    expect(json.email).toBe('test@skt.com')
  })

  it('로그인 사용자 + email_public=false → email null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const privateEmailMember = { ...mockMember, email_public: false }
    const { supabase } = buildChain({ data: privateEmailMember, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost'), makeParams('uuid-1'))
    const json = await res.json()
    expect(json.email).toBeNull()
  })
})

describe('PATCH /api/members/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name_ko: '수정' }),
    })
    const res = await PATCH(req, makeParams('uuid-1'))
    expect(res.status).toBe(401)
  })

  it('다른 사용자 멤버 수정 시도 → 403', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'other-user' } } as never)
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { user_id: 'github-001' }, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name_ko: '수정' }),
    })
    const res = await PATCH(req, makeParams('uuid-1'))
    expect(res.status).toBe(403)
  })

  it('본인 멤버 수정 → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    let callCount = 0
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) return Promise.resolve({ data: { user_id: 'github-001' }, error: null })
        return Promise.resolve({ data: { ...mockMember, name_ko: '수정됨' }, error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name_ko: '수정됨', company: 'SK텔레콤' }),
    })
    const res = await PATCH(req, makeParams('uuid-1'))
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/members/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await DELETE(new Request('http://localhost'), makeParams('uuid-1'))
    expect(res.status).toBe(401)
  })

  it('본인 멤버 삭제 → 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    let callCount = 0
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) return Promise.resolve({ data: { user_id: 'github-001' }, error: null })
        return Promise.resolve({ error: null })
      }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const res = await DELETE(new Request('http://localhost'), makeParams('uuid-1'))
    expect(res.status).toBe(200)
  })
})
