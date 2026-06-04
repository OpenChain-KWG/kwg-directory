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
import { GET } from '@/app/api/admin/export/csv/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)

const ADMIN_USER_ID = 'admin-user-001'
const NON_ADMIN_ID = 'nonadmin-user-002'

const MOCK_MEMBERS = [
  {
    id: '1',
    user_id: 'u1',
    name_ko: '홍길동',
    name_en: 'Gil-dong Hong',
    company: 'ACME',
    role: '개발자',
    category: '기업',
    email: 'hong@example.com',
    phone: '010-1234-5678',
    linkedin: '',
    github: 'honggildong',
    discord: '',
    blog: '',
    tags: ['오픈소스', 'SBOM'],
    approved: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'u2',
    name_ko: '김철수',
    name_en: null,
    company: '연구소',
    role: null,
    category: '연구/공공',
    email: null,
    phone: null,
    linkedin: null,
    github: null,
    discord: null,
    blog: null,
    tags: null,
    approved: false,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
]

function buildSupabaseMock(members = MOCK_MEMBERS) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: members, error: null }),
    })),
  }
}

describe('GET /api/admin/export/csv', () => {
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

  it('어드민: CSV 파일 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toMatch(/kwg-members-\d{4}-\d{2}-\d{2}\.csv/)
  })

  it('어드민: CSV에 UTF-8 BOM 포함 (0xEF 0xBB 0xBF)', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // UTF-8 BOM: EF BB BF
    expect(bytes[0]).toBe(0xef)
    expect(bytes[1]).toBe(0xbb)
    expect(bytes[2]).toBe(0xbf)
  })

  it('어드민: 멤버 데이터 CSV에 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    const text = await res.text()
    expect(text).toContain('홍길동')
    expect(text).toContain('김철수')
    expect(text).toContain('오픈소스;SBOM')
  })

  it('어드민: 승인여부 Y/N으로 표시', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    const text = await res.text()
    expect(text).toContain('"Y"')
    expect(text).toContain('"N"')
  })

  it('어드민: null 값은 빈 문자열로 처리', async () => {
    mockAuth.mockResolvedValue({ user: { id: ADMIN_USER_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
    mockCreateAdminClient.mockReturnValue(buildSupabaseMock() as never)

    const res = await GET()
    const text = await res.text()
    // null 값이 그대로 나오면 안 됨
    expect(text).not.toContain('null')
  })
})
