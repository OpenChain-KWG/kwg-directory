/**
 * Integration tests: DELETE /api/me/delete
 *
 * 비인증 → 401
 * confirmation 누락 → 400
 * confirmation 불일치 → 400
 * rate limit 초과 → 429
 * 정상 → 204 No Content
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
import { auditLog } from '@/lib/audit'
import { DELETE } from '@/app/api/me/delete/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockAuditLog = vi.mocked(auditLog)

const USER_ID = 'github-001'
const MEMBER_ID = 'a0000000-0000-4000-8000-000000000001'
const CONFIRMATION = 'DELETE-MY-ACCOUNT'

const mockMember = {
  id: MEMBER_ID,
  user_id: USER_ID,
  name_ko: '홍길동',
  company: 'SK텔레콤',
  avatar_url: null,
}

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/me/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

function buildSupabase(overrides: {
  member?: unknown
  notifError?: boolean
  memberDeleteError?: boolean
} = {}) {
  const { member = mockMember, notifError = false, memberDeleteError = false } = overrides

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: member, error: null }),
          delete: vi.fn().mockReturnThis(),
          // delete().eq() — 마지막 eq가 Promise 반환
        }
      }
      if (table === 'notifications') {
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: notifError ? { message: 'err' } : null }),
        }
      }
      if (table === 'audit_logs') {
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  }

  // members delete chain 재정의 — eq().eq() 패턴을 위해 별도 처리
  const memberDeleteChain = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: memberDeleteError ? { message: 'db error' } : null }),
  }

  let memberCallCount = 0
  supabase.from = vi.fn((table: string) => {
    if (table === 'members') {
      memberCallCount++
      if (memberCallCount === 1) {
        // 첫 번째 호출: select (maybeSingle)
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: member, error: null }),
        }
      }
      // 두 번째 호출: delete
      return memberDeleteChain
    }
    if (table === 'notifications') {
      return {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: notifError ? { message: 'notif err' } : null }),
      }
    }
    if (table === 'audit_logs') {
      return {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {}
  })

  return supabase
}

describe('DELETE /api/me/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(true)
  })

  it('비인증 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await DELETE(makeRequest({ confirmation: CONFIRMATION }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/인증/)
  })

  it('rate limit 초과 → 429', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCheckRateLimit.mockResolvedValue(false)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await DELETE(makeRequest({ confirmation: CONFIRMATION }))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/한도/)
    expect(res.headers.get('Retry-After')).toBe('86400')
  })

  it('body 없음 → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const req = new Request('http://localhost/api/me/delete', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/confirmation/)
  })

  it('confirmation 불일치 → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue({} as never)

    const res = await DELETE(makeRequest({ confirmation: 'WRONG-VALUE' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/DELETE-MY-ACCOUNT/)
  })

  it('정상 삭제 → 204 No Content', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue(buildSupabase() as never)

    const res = await DELETE(makeRequest({ confirmation: CONFIRMATION }))
    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
  })

  it('세션 쿠키 초기화 헤더 포함', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue(buildSupabase() as never)

    const res = await DELETE(makeRequest({ confirmation: CONFIRMATION }))
    expect(res.status).toBe(204)
    const cookie = res.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain('Max-Age=0')
  })

  it('audit_log 기록 — actorId=null (익명화)', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue(buildSupabase() as never)

    await DELETE(makeRequest({ confirmation: CONFIRMATION }))

    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        action: 'me.delete',
        targetType: 'member',
      }),
    )
  })

  it('멤버 미등록 사용자도 204 (멤버 행 없으면 스킵)', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never)
    mockCreateAdminClient.mockReturnValue(buildSupabase({ member: null }) as never)

    const res = await DELETE(makeRequest({ confirmation: CONFIRMATION }))
    expect(res.status).toBe(204)
  })
})
