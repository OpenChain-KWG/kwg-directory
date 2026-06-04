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
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))
vi.mock('@/lib/logger', () => ({
  captureApiError: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/lib/audit', () => ({ auditLog: vi.fn().mockResolvedValue(undefined) }))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { inviteMember } from '@/lib/groups-io'
import { POST as approvePost } from '@/app/api/admin/approve/route'
import { POST as rejectPost } from '@/app/api/admin/reject/route'
import { POST as reinvitePost } from '@/app/api/admin/reinvite/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockIsAdmin = vi.mocked(isAdminWithMfa)
const mockInviteMember = vi.mocked(inviteMember)

const ADMIN_ID = 'admin-001'
const MEMBER_ID = 'a0000000-0000-4000-8000-000000000001'

const pendingMember = {
  id: MEMBER_ID,
  name_ko: '홍길동',
  contact_email: 'hong@example.com',
  email: 'hong@example.com',
  subscribe_mailing_list: true,
  approved: false,
}

/**
 * 단일 체인을 공유하는 mock 빌더.
 * eq()는 항상 this 반환(mockReturnThis). 마지막 체인이 await될 때 chain이 반환되며
 * `{ error }` 구조분해 시 error=undefined로 에러 없음 처리.
 */
function buildChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: pendingMember, error: null }),
  }
  return { from: vi.fn(() => chain), chain }
}

describe('POST /api/admin/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
  })

  it('비인증 사용자: 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    expect((await approvePost(req)).status).toBe(401)
  })

  it('비어드민: 403', async () => {
    mockIsAdmin.mockResolvedValue(false)
    mockCreateAdminClient.mockReturnValue(buildChain() as never)
    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    expect((await approvePost(req)).status).toBe(403)
  })

  it('id 미전달: 400', async () => {
    mockCreateAdminClient.mockReturnValue(buildChain() as never)
    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({}),
    })
    expect((await approvePost(req)).status).toBe(400)
  })

  it('subscribe_mailing_list=true → inviteMember 호출, inviteStatus=sent', async () => {
    const { chain, from } = buildChain()
    // 첫 번째 single: 멤버 조회, 두 번째 single: update().select().single()
    chain.single
      .mockResolvedValueOnce({ data: pendingMember, error: null })
      .mockResolvedValueOnce({ data: { ...pendingMember, approved: true }, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    const res = await approvePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.inviteStatus).toBe('sent')
    expect(mockInviteMember).toHaveBeenCalledWith('hong@example.com', '홍길동')
  })

  it('subscribe_mailing_list=false → inviteMember 미호출, inviteStatus=skipped', async () => {
    const memberNoSub = { ...pendingMember, subscribe_mailing_list: false }
    const { chain, from } = buildChain()
    chain.single
      .mockResolvedValueOnce({ data: memberNoSub, error: null })
      .mockResolvedValueOnce({ data: { ...memberNoSub, approved: true }, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    const res = await approvePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.inviteStatus).toBe('skipped')
    expect(mockInviteMember).not.toHaveBeenCalled()
  })

  it('inviteMember 실패 시에도 승인 200 반환, inviteStatus=failed', async () => {
    mockInviteMember.mockRejectedValueOnce(new Error('groups.io 연결 오류'))
    const { chain, from } = buildChain()
    chain.single
      .mockResolvedValueOnce({ data: pendingMember, error: null })
      .mockResolvedValueOnce({ data: { ...pendingMember, approved: true }, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/approve', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    const res = await approvePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.inviteStatus).toBe('failed')
  })
})

describe('POST /api/admin/reject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
  })

  it('비인증: 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    const req = new Request('http://localhost/api/admin/reject', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID, reason: '가입 자격 미해당' }),
    })
    expect((await rejectPost(req)).status).toBe(401)
  })

  it('reason 미전달: 400', async () => {
    mockCreateAdminClient.mockReturnValue(buildChain() as never)
    const req = new Request('http://localhost/api/admin/reject', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    expect((await rejectPost(req)).status).toBe(400)
  })

  it('거절 성공 → 200', async () => {
    // eq()는 항상 mockReturnThis()로 chain 반환.
    // update().eq()의 await 결과는 chain(비프로미스) → error=undefined → 에러 없음.
    const { chain, from } = buildChain()
    chain.single.mockResolvedValueOnce({ data: pendingMember, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/reject', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID, reason: '가입 자격 미해당' }),
    })
    const res = await rejectPost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

describe('POST /api/admin/reinvite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: ADMIN_ID } } as never)
    mockIsAdmin.mockResolvedValue(true)
  })

  it('비인증: 401', async () => {
    mockAuth.mockResolvedValue(null as never)
    const req = new Request('http://localhost/api/admin/reinvite', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    expect((await reinvitePost(req)).status).toBe(401)
  })

  it('미승인 멤버 재발송: 400', async () => {
    const { chain, from } = buildChain()
    chain.single.mockResolvedValueOnce({ data: { ...pendingMember, approved: false }, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/reinvite', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    expect((await reinvitePost(req)).status).toBe(400)
  })

  it('재발송 성공 → inviteStatus: sent', async () => {
    const approvedMember = { ...pendingMember, approved: true }
    const { chain, from } = buildChain()
    chain.single.mockResolvedValueOnce({ data: approvedMember, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/reinvite', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    const res = await reinvitePost(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.inviteStatus).toBe('sent')
    expect(mockInviteMember).toHaveBeenCalledWith('hong@example.com', '홍길동')
  })

  it('재발송 실패 → 500', async () => {
    mockInviteMember.mockRejectedValueOnce(new Error('네트워크 오류'))
    const approvedMember = { ...pendingMember, approved: true }
    const { chain, from } = buildChain()
    chain.single.mockResolvedValueOnce({ data: approvedMember, error: null })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost/api/admin/reinvite', {
      method: 'POST', body: JSON.stringify({ id: MEMBER_ID }),
    })
    const res = await reinvitePost(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.inviteStatus).toBe('failed')
  })
})
