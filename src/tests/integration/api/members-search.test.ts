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

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { GET } from '@/app/api/members/search/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const mockMembersData = [
  {
    id: 'uuid-1',
    user_id: 'github-001',
    name_ko: '홍길동',
    name_en: 'Hong Gildong',
    company: 'SK텔레콤',
    role: '엔지니어',
    bio: '오픈소스 기여자',
    category: '기업',
    email: 'test@skt.com',
    email_public: true,
    linkedin: null,
    github: 'https://github.com/hong',
    discord: null,
    blog: null,
    avatar_url: null,
    tags: ['SBOM', 'License'],
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'uuid-2',
    user_id: 'github-002',
    name_ko: '김철수',
    name_en: null,
    company: '카카오',
    role: '연구원',
    bio: null,
    category: '기업',
    email: 'kim@kakao.com',
    email_public: false,
    linkedin: null,
    github: null,
    discord: null,
    blog: null,
    avatar_url: null,
    tags: [],
    approved: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
]

function buildSupabaseMock(returnValue: { data: unknown; error: unknown }) {
  const dataArr = Array.isArray(returnValue.data) ? returnValue.data : []
  const rangeResult = {
    data: returnValue.data,
    error: returnValue.error,
    count: returnValue.error ? null : dataArr.length,
  }
  const limitResult = {
    data: returnValue.data,
    error: returnValue.error,
    count: returnValue.error ? null : dataArr.length,
  }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(rangeResult),
    limit: vi.fn().mockResolvedValue(limitResult),
  }
  return { supabase: { from: vi.fn(() => chain) }, chain }
}

describe('GET /api/members/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(true)
  })

  describe('응답 envelope 형식', () => {
    it('기본 요청 → members, total, page, pageSize, totalPages 반환', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
      const { supabase } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toHaveProperty('members')
      expect(json).toHaveProperty('total')
      expect(json).toHaveProperty('page')
      expect(json).toHaveProperty('pageSize')
      expect(json).toHaveProperty('totalPages')
      expect(json.page).toBe(1)
      expect(json.pageSize).toBe(24)
    })
  })

  describe('이메일 보안 — email_public + 인증 조합', () => {
    it('인증 사용자 + email_public=true → 이메일 반환', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
      const { supabase } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      const json = await res.json()

      expect(res.status).toBe(200)
      // uuid-1: email_public=true, 인증 → 이메일 반환
      const member1 = json.members.find((m: { id: string }) => m.id === 'uuid-1')
      expect(member1.email).toBe('test@skt.com')
    })

    it('인증 사용자 + email_public=false → 이메일 null', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
      const { supabase } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      const json = await res.json()

      // uuid-2: email_public=false → null
      const member2 = json.members.find((m: { id: string }) => m.id === 'uuid-2')
      expect(member2.email).toBeNull()
    })

    it('비인증 사용자 → 모든 이메일 null', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      const json = await res.json()

      expect(res.status).toBe(200)
      for (const m of json.members) {
        expect(m.email).toBeNull()
      }
    })
  })

  describe('검색 (q 파라미터)', () => {
    it('?q=홍길동 → or 필터 호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?q=홍길동'))
      expect(chain.or).toHaveBeenCalledWith(
        'name_ko.ilike."%홍길동%",name_en.ilike."%홍길동%",company.ilike."%홍길동%"'
      )
    })

    it('콤마 포함 검색어 → 값이 큰따옴표로 인용되어 logic tree 파싱 실패(500) 방지', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(
        new Request(`http://localhost/api/members/search?q=${encodeURIComponent('삼성, LG')}`)
      )
      expect(chain.or).toHaveBeenCalledWith(
        'name_ko.ilike."%삼성, LG%",name_en.ilike."%삼성, LG%",company.ilike."%삼성, LG%"'
      )
    })

    it('필터 인젝션 페이로드 → 별도 OR 조건이 아닌 리터럴 값으로 갇힌다 (BUG-003)', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      // email.ilike 필터를 주입해 비공개 컬럼 enumeration을 시도하는 페이로드
      const payload = 'a,email.ilike.b'
      await GET(
        new Request(`http://localhost/api/members/search?q=${encodeURIComponent(payload)}`)
      )
      expect(chain.or).toHaveBeenCalledWith(
        'name_ko.ilike."%a,email.ilike.b%",name_en.ilike."%a,email.ilike.b%",company.ilike."%a,email.ilike.b%"'
      )
    })

    it('?q= (빈 문자열) → or 필터 미호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?q='))
      expect(chain.or).not.toHaveBeenCalled()
    })
  })

  describe('카테고리 필터', () => {
    it('?category=기업 → in 필터 호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?category=기업'))
      expect(chain.in).toHaveBeenCalledWith('category', ['기업'])
    })

    it('?category=기업,학계 → in 필터에 배열 전달', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?category=%EA%B8%B0%EC%97%85%2C%ED%95%99%EA%B3%84'))
      expect(chain.in).toHaveBeenCalledWith('category', ['기업', '학계'])
    })

    it('category 미지정 → in 필터 미호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search'))
      expect(chain.in).not.toHaveBeenCalled()
    })

    it('?category=대기업 (유효하지 않은 값) → 400', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase } = buildSupabaseMock({ data: [], error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search?category=대기업'))
      expect(res.status).toBe(400)
    })
  })

  describe('정렬 (sort 파라미터)', () => {
    it('?sort=name → name_ko 오름차순 정렬', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?sort=name'))
      expect(chain.order).toHaveBeenCalledWith('name_ko', { ascending: true })
    })

    it('?sort=recent → created_at 내림차순 정렬', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?sort=recent'))
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('?sort=random → limit(100) 호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?sort=random'))
      expect(chain.limit).toHaveBeenCalledWith(100)
    })

    it('?sort=invalid → 400', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase } = buildSupabaseMock({ data: [], error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search?sort=popular'))
      expect(res.status).toBe(400)
    })
  })

  describe('페이지네이션', () => {
    it('?page=2&pageSize=1 → total/totalPages 계산 정확', async () => {
      mockAuth.mockResolvedValue(null as never)
      const mockData = [mockMembersData[1]]
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 2 }),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 2 }),
      }
      mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

      const res = await GET(new Request('http://localhost/api/members/search?page=2&pageSize=1'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.page).toBe(2)
      expect(json.pageSize).toBe(1)
      expect(json.total).toBe(2)
      expect(json.totalPages).toBe(2)
    })

    it('pageSize=200 → 100으로 clamp', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search?pageSize=200'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.pageSize).toBe(100)
      // range(0, 99) 호출 확인
      expect(chain.range).toHaveBeenCalledWith(0, 99)
    })

    it('?page=2&pageSize=24 → range(24, 47) 호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search?page=2&pageSize=24'))
      expect(chain.range).toHaveBeenCalledWith(24, 47)
    })
  })

  describe('Rate limiting', () => {
    it('rate limit 초과 → 429', async () => {
      mockCheckRateLimit.mockResolvedValue(false)
      mockAuth.mockResolvedValue(null as never)
      mockCreateAdminClient.mockReturnValue({} as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      expect(res.status).toBe(429)
    })
  })

  describe('Supabase 에러 처리', () => {
    it('DB 에러 → 500', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase } = buildSupabaseMock({ data: null, error: { message: 'DB Error' } })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      const res = await GET(new Request('http://localhost/api/members/search'))
      expect(res.status).toBe(500)
    })
  })

  describe('approved=true 강제', () => {
    it('approved=true eq 필터 항상 호출', async () => {
      mockAuth.mockResolvedValue(null as never)
      const { supabase, chain } = buildSupabaseMock({ data: mockMembersData, error: null })
      mockCreateAdminClient.mockReturnValue(supabase as never)

      await GET(new Request('http://localhost/api/members/search'))
      expect(chain.eq).toHaveBeenCalledWith('approved', true)
    })
  })
})
