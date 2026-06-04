/**
 * Integration tests: GET /api/me/export
 *
 * 비인증 → 401
 * rate limit 초과 → 429
 * 정상 → 200 + Content-Disposition + 응답 구조
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))
vi.mock('@/lib/audit', () => ({ auditLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/logger', () => ({
  captureApiError: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { GET } from '@/app/api/me/export/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const USER_ID = 'github-001'
const MEMBER_ID = 'a0000000-0000-4000-8000-000000000001'

const mockMember = {
  id: MEMBER_ID,
  user_id: USER_ID,
  name_ko: '홍길동',
  company: 'SK텔레콤',
  approved: true,
  created_at: '2024-01-01T00:00:00Z',
}

function makeRequest(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/me/export', {
    method: 'GET',
    headers,
  })
}

function buildSupabaseChain(overrides: {
  member?: unknown
  auditLogs?: unknown[]
  notifications?: unknown[]
} = {}) {
  const {
    member = mockMember,
    auditLogs = [{ id: 'log-1', action: 'me.export', created_at: '2024-01-02T00:00:00Z' }],
    notifications = [],
  } = overrides

  return {
    from: vi.fn((table: string) => {
      if (table === 'members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: member, error: null }),
        }
      }
      if (table === 'audit_logs') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: auditLogs, error: null }),
        }
      }
      if (table === 'notifications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: notifications, error: null }),
        }
      }
      return {}
    }),
  }
}

describe('GET /api/me/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(true)
  })

  it('비인증 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/인증/)
  })

  it('rate limit 초과 → 429', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, email: 'test@example.com', name: '홍길동', provider: 'github' } } as never)
    // 첫 번째 checkRateLimit(ipKey) → false (초과)
    mockCheckRateLimit.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/한도/)
    expect(res.headers.get('Retry-After')).toBe('3600')
  })

  it('정상 요청 → 200 + JSON + Content-Disposition', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: USER_ID,
        email: 'test@example.com',
        name: '홍길동',
        provider: 'github',
      },
    } as never)

    mockCreateAdminClient.mockReturnValue(buildSupabaseChain() as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')

    const disposition = res.headers.get('Content-Disposition') ?? ''
    expect(disposition).toContain('attachment')
    expect(disposition).toContain(`kwg-directory-export-${USER_ID}`)

    const body = await res.json()
    expect(body).toHaveProperty('exportedAt')
    expect(body).toHaveProperty('user')
    expect(body.user.id).toBe(USER_ID)
    expect(body).toHaveProperty('member')
    expect(body).toHaveProperty('auditLog')
    expect(body).toHaveProperty('notifications')
    expect(Array.isArray(body.auditLog)).toBe(true)
    expect(Array.isArray(body.notifications)).toBe(true)
  })

  it('멤버 미등록 사용자 → 200 + member: null', async () => {
    mockAuth.mockResolvedValue({
      user: { id: USER_ID, email: 'test@example.com', name: '홍길동', provider: 'github' },
    } as never)

    mockCreateAdminClient.mockReturnValue(buildSupabaseChain({ member: null, auditLogs: [], notifications: [] }) as never)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.member).toBeNull()
  })

  it('Cache-Control: no-store 헤더 포함', async () => {
    mockAuth.mockResolvedValue({
      user: { id: USER_ID, email: 'test@example.com', name: '홍길동', provider: 'github' },
    } as never)
    mockCreateAdminClient.mockReturnValue(buildSupabaseChain() as never)

    const res = await GET(makeRequest())
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
