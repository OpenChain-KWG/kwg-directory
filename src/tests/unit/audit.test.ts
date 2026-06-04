import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock deps before import
vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/audit'

const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockLogger = vi.mocked(logger)

function buildSupabaseMock(insertResult: { error: unknown } = { error: null }) {
  const insertChain = {
    insert: vi.fn().mockResolvedValue(insertResult),
  }
  return { from: vi.fn(() => insertChain), chain: insertChain }
}

describe('auditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('정상 케이스 — supabase insert 호출', async () => {
    const { from, chain } = buildSupabaseMock()
    mockCreateAdminClient.mockReturnValue({ from } as never)

    await auditLog({
      actorId: 'actor-001',
      action: 'member.approve',
      targetType: 'member',
      targetId: 'target-001',
      before: { approved: false },
      after: { approved: true },
    })

    expect(from).toHaveBeenCalledWith('audit_logs')
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'actor-001',
        action: 'member.approve',
        target_type: 'member',
        target_id: 'target-001',
        before: { approved: false },
        after: { approved: true },
      }),
    )
  })

  it('insert 에러 → logger.error 호출, 예외 미전파', async () => {
    const dbError = new Error('DB connection failed')
    const { from } = buildSupabaseMock({ error: dbError })
    mockCreateAdminClient.mockReturnValue({ from } as never)

    // auditLog should not throw
    await expect(
      auditLog({
        actorId: 'actor-001',
        action: 'member.reject',
        targetType: 'member',
      }),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('createAdminClient 예외 → logger.error 호출, 예외 미전파', async () => {
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error('Service role key missing')
    })

    await expect(
      auditLog({
        actorId: 'actor-001',
        action: 'admin.add',
        targetType: 'admin',
      }),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('actorId null 허용', async () => {
    const { from, chain } = buildSupabaseMock()
    mockCreateAdminClient.mockReturnValue({ from } as never)

    await auditLog({
      actorId: null,
      action: 'member.approve',
      targetType: 'member',
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ actor_id: null }),
    )
  })

  it('request 헤더에서 IP + UA 추출', async () => {
    const { from, chain } = buildSupabaseMock()
    mockCreateAdminClient.mockReturnValue({ from } as never)

    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'user-agent': 'TestAgent/1.0',
      },
    })

    await auditLog({
      actorId: 'actor-001',
      action: 'member.approve',
      targetType: 'member',
      request: req,
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '1.2.3.4',
        user_agent: 'TestAgent/1.0',
      }),
    )
  })

  it('request 없으면 ip/ua null', async () => {
    const { from, chain } = buildSupabaseMock()
    mockCreateAdminClient.mockReturnValue({ from } as never)

    await auditLog({
      actorId: 'actor-001',
      action: 'member.approve',
      targetType: 'member',
    })

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: null,
        user_agent: null,
      }),
    )
  })
})
