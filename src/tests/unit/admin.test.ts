import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdmin, isAdminWithMfa, isMfaRequired } from '@/lib/admin'

const mockCreateAdminClient = vi.mocked(createAdminClient)

function buildAdminChain(found: boolean) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        found
          ? { data: { user_id: 'admin-1' }, error: null }
          : { data: null, error: { code: 'PGRST116' } },
      ),
    })),
  }
}

describe('isAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admins 테이블에 존재하는 user_id → true', async () => {
    mockCreateAdminClient.mockReturnValue(buildAdminChain(true) as never)
    expect(await isAdmin('admin-1')).toBe(true)
  })

  it('admins 테이블에 없는 user_id → false', async () => {
    mockCreateAdminClient.mockReturnValue(buildAdminChain(false) as never)
    expect(await isAdmin('regular-user')).toBe(false)
  })

  it('빈 문자열 user_id → false', async () => {
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as never)
    expect(await isAdmin('')).toBe(false)
  })
})

describe('isMfaRequired', () => {
  afterEach(() => {
    delete process.env.ADMIN_MFA_REQUIRED
  })

  it('ADMIN_MFA_REQUIRED=on → true', () => {
    process.env.ADMIN_MFA_REQUIRED = 'on'
    expect(isMfaRequired()).toBe(true)
  })

  it('ADMIN_MFA_REQUIRED 미설정 → false', () => {
    delete process.env.ADMIN_MFA_REQUIRED
    expect(isMfaRequired()).toBe(false)
  })

  it('ADMIN_MFA_REQUIRED=off → false', () => {
    process.env.ADMIN_MFA_REQUIRED = 'off'
    expect(isMfaRequired()).toBe(false)
  })
})

describe('isAdminWithMfa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ADMIN_MFA_REQUIRED
  })
  afterEach(() => {
    delete process.env.ADMIN_MFA_REQUIRED
  })

  it('admin + ADMIN_MFA_REQUIRED=off → MFA 무관하게 허용', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'off'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(true) as never)

    expect(await isAdminWithMfa('admin-1', false)).toBe(true)
    expect(await isAdminWithMfa('admin-1', undefined)).toBe(true)
  })

  it('admin + ADMIN_MFA_REQUIRED=on + mfaEnabled=true → 허용', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'on'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(true) as never)

    expect(await isAdminWithMfa('admin-1', true)).toBe(true)
  })

  it('admin + ADMIN_MFA_REQUIRED=on + mfaEnabled=false → 거부 (403 대상)', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'on'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(true) as never)

    expect(await isAdminWithMfa('admin-1', false)).toBe(false)
  })

  it('admin + ADMIN_MFA_REQUIRED=on + mfaEnabled=undefined → 거부', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'on'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(true) as never)

    expect(await isAdminWithMfa('admin-1', undefined)).toBe(false)
  })

  it('비admin → ADMIN_MFA_REQUIRED 무관하게 거부', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'off'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(false) as never)

    expect(await isAdminWithMfa('regular-user', true)).toBe(false)
  })

  it('ADMIN_MFA_REQUIRED=on + 비admin + mfaEnabled=true → 거부 (admin 아님)', async () => {
    process.env.ADMIN_MFA_REQUIRED = 'on'
    mockCreateAdminClient.mockReturnValue(buildAdminChain(false) as never)

    expect(await isAdminWithMfa('regular-user', true)).toBe(false)
  })
})
