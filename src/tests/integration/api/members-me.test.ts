import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { GET, PATCH, DELETE } from '@/app/api/members/me/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)

const mockMember = {
  id: 'member-uuid-1',
  user_id: 'github-001',
  name_ko: '홍길동',
  name_en: 'Gildong Hong',
  company: 'SK텔레콤',
  email: 'test@skt.com',
  email_public: true,
  phone: '010-1234-5678',
  phone_public: false,
  avatar_url: 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/photo.jpg',
  tags: ['SBOM'],
  approved: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function buildChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
    single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
    ...overrides,
  }
  return chain
}

describe('GET /api/members/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('로그인 + 레코드 없음 → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    const chain = buildChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const res = await GET()
    expect(res.status).toBe(404)
  })

  it('로그인 + 레코드 있음 → 본인 레코드 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    const chain = buildChain()
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name_ko).toBe('홍길동')
    expect(json.email).toBe('test@skt.com')
  })
})

describe('PATCH /api/members/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const req = new Request('http://localhost/api/members/me', {
      method: 'PATCH',
      body: JSON.stringify({ name_ko: '홍길동', company: 'SK텔레콤' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('이름 변경 시 approved=false로 재설정', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)

    const updatedMember = { ...mockMember, name_ko: '김새이름', approved: false }
    const chain = buildChain({
      single: vi.fn().mockResolvedValue({ data: updatedMember, error: null }),
    })
    const fromMock = vi.fn(() => chain)
    mockCreateAdminClient.mockReturnValue({ from: fromMock } as never)

    const req = new Request('http://localhost/api/members/me', {
      method: 'PATCH',
      body: JSON.stringify({ name_ko: '김새이름', company: 'SK텔레콤' }),
    })
    const res = await PATCH(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.approved).toBe(false)
    // update 호출 시 approved=false가 포함됐는지 확인
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ approved: false })
    )
  })

  it('email 빈 문자열로 PATCH → 400 아님 (스키마 허용)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)

    const updatedMember = { ...mockMember, email: null }
    const chain = buildChain({
      single: vi.fn().mockResolvedValue({ data: updatedMember, error: null }),
    })
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name_ko: mockMember.name_ko,
        name_en: mockMember.name_en,
        company: mockMember.company,
        email: '',
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('email 잘못된 형식으로 PATCH → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const req = new Request('http://localhost/api/members/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        email: 'not-an-email',
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('입력값이 올바르지 않습니다.')
    expect(json.details).toBeDefined()
  })

  it('이름 외 필드 변경 시 approved 재설정 없음', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)

    const updatedMember = { ...mockMember, bio: '새로운 소개' }
    const chain = buildChain({
      single: vi.fn().mockResolvedValue({ data: updatedMember, error: null }),
    })
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name_ko: mockMember.name_ko,
        name_en: mockMember.name_en,
        company: mockMember.company,
        bio: '새로운 소개',
      }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    // update 호출 시 approved 키가 없어야 함
    const updateArg = chain.update.mock.calls[0][0] as Record<string, unknown>
    expect(updateArg).not.toHaveProperty('approved')
  })
})

describe('DELETE /api/members/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await DELETE()
    expect(res.status).toBe(401)
  })

  it('본인 레코드 없음 → 404', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)
    const chain = buildChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => chain),
      storage: { from: vi.fn() },
    } as never)

    const res = await DELETE()
    expect(res.status).toBe(404)
  })

  it('본인 레코드 삭제 → 200 + success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'github-001' } } as never)

    // select chain: maybeSingle로 멤버 반환
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
    }
    // delete chain: eq가 최종 Promise 반환
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }

    let callCount = 0
    const fromMock = vi.fn(() => {
      callCount++
      return callCount === 1 ? selectChain : deleteChain
    })

    const storageMock = {
      from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ error: null }) })),
    }
    mockCreateAdminClient.mockReturnValue({
      from: fromMock,
      storage: storageMock,
    } as never)

    const res = await DELETE()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('타인 레코드 삭제 불가 (user_id 불일치 → 404)', async () => {
    // user_id가 다른 계정으로 로그인한 경우 maybeSingle이 null 반환
    mockAuth.mockResolvedValue({ user: { id: 'other-user' } } as never)
    const chain = buildChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => chain),
      storage: { from: vi.fn() },
    } as never)

    const res = await DELETE()
    expect(res.status).toBe(404)
  })
})
