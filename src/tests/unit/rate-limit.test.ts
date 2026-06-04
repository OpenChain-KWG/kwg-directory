import { describe, it, expect, beforeEach, vi } from 'vitest'

// rate-limit.ts는 모듈 레벨 Map을 사용하므로 모듈을 재임포트로 초기화
describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.resetModules()
    // Ensure Upstash env vars are not set → forces in-memory path
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('허용 한도 내 요청은 true 반환', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const key = `test:${Date.now()}`
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true)
  })

  it('한도 초과 시 false 반환', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const key = `test:${Date.now()}`
    await checkRateLimit(key, 2, 60_000)
    await checkRateLimit(key, 2, 60_000)
    expect(await checkRateLimit(key, 2, 60_000)).toBe(false)
  })

  it('다른 key는 독립적으로 카운트', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const ts = Date.now()
    const keyA = `test-a:${ts}`
    const keyB = `test-b:${ts}`
    await checkRateLimit(keyA, 1, 60_000)
    expect(await checkRateLimit(keyA, 1, 60_000)).toBe(false)
    expect(await checkRateLimit(keyB, 1, 60_000)).toBe(true)
  })
})

/**
 * Upstash 경로는 동적 import(런타임) 특성으로 인해 vi.doMock이 한계가 있음.
 * 환경변수 없는 경우에도 fallback이 정상 동작함을 확인.
 * 실제 Upstash 연동 테스트는 실제 env가 있는 환경에서 진행.
 */
describe('checkRateLimit (Upstash env 없음 → in-memory 동작)', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('UPSTASH_REDIS_REST_URL 없으면 in-memory 사용 — 허용', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const key = `upstash-absent:${Date.now()}`
    const result = await checkRateLimit(key, 5, 60_000)
    expect(result).toBe(true)
  })

  it('UPSTASH_REDIS_REST_TOKEN만 있고 URL 없으면 in-memory 사용', async () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-only'
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const key = `token-only:${Date.now()}`
    const result = await checkRateLimit(key, 5, 60_000)
    expect(result).toBe(true)
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('한도 초과 시에도 in-memory fallback에서 false 반환', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const key = `exceed:${Date.now()}`
    await checkRateLimit(key, 1, 60_000)
    expect(await checkRateLimit(key, 1, 60_000)).toBe(false)
  })
})

describe('getClientIp', () => {
  it('x-forwarded-for 첫 번째 IP 반환', async () => {
    const { getClientIp } = await import('@/lib/rate-limit')
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('x-real-ip 반환', async () => {
    const { getClientIp } = await import('@/lib/rate-limit')
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.10.11.12' },
    })
    expect(getClientIp(req)).toBe('9.10.11.12')
  })

  it('헤더 없으면 unknown 반환', async () => {
    const { getClientIp } = await import('@/lib/rate-limit')
    const req = new Request('http://localhost')
    expect(getClientIp(req)).toBe('unknown')
  })
})
