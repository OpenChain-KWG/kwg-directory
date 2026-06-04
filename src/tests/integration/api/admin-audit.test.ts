/**
 * Integration test: admin approve → audit_log 1건 생성 검증
 * auditLog 함수를 spy하여 approve API가 올바른 payload로 호출하는지 확인.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdminWithMfa: vi.fn() }))
vi.mock('@/lib/email', () => ({
  sendApprovalEmail: vi.fn().mockResolvedValue(undefined),
  sendRejectionEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/groups-io', () => ({ inviteMember: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('10.0.0.1'),
}))
vi.mock('@/lib/logger', () => ({
  captureApiError: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/lib/audit', () => ({ auditLog: vi.fn().mockResolvedValue(undefined) }))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { auditLog } from '@/lib/audit'
import { POST as approvePost } from '@/app/api/admin/approve/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)
const mockAuditLog = vi.mocked(auditLog)

const ADMIN_ID = 'admin-uuid-001'
const MEMBER_ID = 'b0000000-0000-4000-8000-000000000002'

const approvedMemberData = {
  id: MEMBER_ID,
  name_ko: '김철수',
  contact_email: 'chul@example.com',
  email: 'chul@example.com',
  subscribe_mailing_list: false,
  approved: true,
}

function buildApproveChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValueOnce({ data: { ...approvedMemberData, approved: false }, error: null })
      .mockResolvedValueOnce({ data: approvedMemberData, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('POST /api/admin/approve — audit_log 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
  })

  it('승인 성공 시 auditLog가 정확한 payload로 1회 호출됨', async () => {
    const { from } = buildApproveChain()
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ id: MEMBER_ID }),
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'TestSuite/1.0',
      },
    })

    const res = await approvePost(req)
    expect(res.status).toBe(200)

    // audit_log가 정확히 1회 호출되었는지 검증
    expect(mockAuditLog).toHaveBeenCalledTimes(1)
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ADMIN_ID,
        action: 'member.approve',
        targetType: 'member',
        targetId: MEMBER_ID,
        before: { approved: false },
        after: { approved: true },
      }),
    )
  })

  it('DB 업데이트 실패 시 auditLog 호출 안 됨', async () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValueOnce({ data: { ...approvedMemberData, approved: false }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'DB error' } }),
    }
    mockCreateAdminClient.mockReturnValue({ from: vi.fn(() => chain) } as never)

    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ id: MEMBER_ID }),
    })

    const res = await approvePost(req)
    expect(res.status).toBe(500)
    expect(mockAuditLog).not.toHaveBeenCalled()
  })
})
