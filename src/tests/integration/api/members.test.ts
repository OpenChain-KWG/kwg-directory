import { describe, it, expect, vi, beforeEach } from 'vitest'

// auth mock
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// supabase-admin mock
vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))
vi.mock('@/lib/logger', () => ({ captureApiError: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendNewMemberNotification: vi.fn().mockResolvedValue(undefined) }))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendNewMemberNotification } from '@/lib/email'
import { GET, POST } from '@/app/api/members/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockSendNewMemberNotification = vi.mocked(sendNewMemberNotification)

const mockMembers = [
  {
    id: 'uuid-1',
    user_id: 'github-001',
    name_ko: '홍길동',
    company: 'SK텔레콤',
    email: 'test@skt.com',
    email_public: true,
    avatar_url: 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg',
    tags: ['SBOM', 'License'],
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

function buildSupabaseMock(returnValue: { data: unknown; error: unknown }) {
  const dataArr = Array.isArray(returnValue.data) ? returnValue.data : []
  const rangeValue = {
    data: returnValue.data,
    error: returnValue.error,
    count: returnValue.error ? null : dataArr.length,
  }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(rangeValue),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue(returnValue),
  }
  return { supabase: { from: vi.fn(() => chain) }, chain }
}

describe('GET /api/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('인증된 사용자: approved 멤버 목록 반환, 이메일 필드 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data[0].email).toBe('test@skt.com') // email_public=true + 인증
  })

  it('비인증 사용자: email_public=true여도 이메일은 null', async () => {
    mockAuth.mockResolvedValue(null as never)
    const { supabase } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data[0].email).toBeNull()
  })

  it('인증 사용자: email_public=false면 email은 null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const privateEmailMembers = [{ ...mockMembers[0], email_public: false }]
    const { supabase } = buildSupabaseMock({ data: privateEmailMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data[0].email).toBeNull() // email_public=false → 인증되어도 노출 금지
  })

  it('Supabase 에러 시 500 응답', async () => {
    mockAuth.mockResolvedValue(null as never)
    const { supabase } = buildSupabaseMock({ data: null, error: { message: 'DB Error' } })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    expect(res.status).toBe(500)
  })

  it('avatar_url 포함 멤버 생성 → 응답에 avatar_url 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data[0].avatar_url).toBe(mockMembers[0].avatar_url)
  })

  it('tags 포함 멤버 → 응답에 tags 배열 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data[0].tags).toEqual(['SBOM', 'License'])
  })

  it('?tag=SBOM 쿼리 시 contains 필터 호출', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase, chain } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    const res = await GET(new Request('http://localhost/api/members?tag=SBOM'))
    expect(res.status).toBe(200)
    expect(chain.overlaps).toHaveBeenCalledWith('tags', ['SBOM'])
  })

  it('?search=a,email.ilike.b → or 값이 큰따옴표로 인용되어 필터 인젝션 차단 (BUG-003)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { supabase, chain } = buildSupabaseMock({ data: mockMembers, error: null })
    mockCreateAdminClient.mockReturnValue(supabase as never)

    await GET(
      new Request(
        `http://localhost/api/members?search=${encodeURIComponent('a,email.ilike.b')}`
      )
    )
    expect(chain.or).toHaveBeenCalledWith(
      'name_ko.ilike."%a,email.ilike.b%",company.ilike."%a,email.ilike.b%"'
    )
  })
})

describe('POST /api/members', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비인증 사용자: 401 응답', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({ name_ko: '홍길동', company: 'SK텔레콤' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('인증된 사용자 + 유효한 body: 201 + 생성된 멤버 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', image: null, provider: 'github' } } as never)

    const newMember = { ...mockMembers[0], approved: false }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: newMember, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        contact_email: 'hong@example.com',
        subscribe_mailing_list: true,
        privacy_agreed_at: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name_ko).toBe('홍길동')
  })

  it('category 빈 문자열 body → 400 아님, 201 (BUG-001)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', image: null, provider: 'github' } } as never)

    const newMember = { ...mockMembers[0], approved: false }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: newMember, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        category: '',
        contact_email: 'hong@example.com',
        subscribe_mailing_list: true,
        privacy_agreed_at: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('tags 포함 멤버 생성 → 응답에 tags 배열 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', image: null, provider: 'github' } } as never)

    const newMember = { ...mockMembers[0], tags: ['SBOM', 'License'], approved: false }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: newMember, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        tags: ['SBOM', 'License'],
        contact_email: 'hong@example.com',
        subscribe_mailing_list: false,
        privacy_agreed_at: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.tags).toEqual(['SBOM', 'License'])
  })

  it('201 성공 시 신규 가입 알림 이메일 함수 호출', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', image: null, provider: 'github' } } as never)
    mockSendNewMemberNotification.mockResolvedValue(undefined)

    const newMember = {
      ...mockMembers[0],
      approved: false,
      contact_email: 'hong@example.com',
      created_at: '2024-01-01T00:00:00Z',
    }
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: newMember, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        contact_email: 'hong@example.com',
        subscribe_mailing_list: false,
        privacy_agreed_at: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    // 이메일 함수가 호출되었는지 검증 (비동기 fire-and-forget이므로 약간 대기)
    await new Promise((r) => setTimeout(r, 10))
    expect(mockSendNewMemberNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        contact_email: 'hong@example.com',
      })
    )
  })

  it('인증된 사용자가 이미 프로필이 있는 경우: 409 응답', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', image: null, provider: 'github' } } as never)

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name_ko: '홍길동',
        company: 'SK텔레콤',
        contact_email: 'hong@example.com',
        subscribe_mailing_list: false,
        privacy_agreed_at: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})
