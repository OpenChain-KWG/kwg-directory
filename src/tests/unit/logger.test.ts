import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import {
  logger,
  redactPii,
  maskEmail,
  maskId,
  maskIp,
  maskName,
  captureApiError,
} from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

describe('logger / PII masking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('maskEmail', () => {
    it('preserves first 3 chars + masks rest, keeps domain', () => {
      expect(maskEmail('alice@example.com')).toBe('ali***@example.com')
    })
    it('handles short local part', () => {
      expect(maskEmail('ab@x.com')).toBe('xxx***@x.com')
    })
    it('returns sentinel for malformed', () => {
      expect(maskEmail('no-at-sign')).toBe('xxx***')
    })
  })

  describe('maskId', () => {
    it('masks UUID with first 4 chars', () => {
      expect(maskId('123e4567-e89b-12d3-a456-426614174000')).toBe('123e***')
    })
    it('masks short ids to triple star', () => {
      expect(maskId('ab')).toBe('***')
    })
    it('masks long opaque id with first 4', () => {
      expect(maskId('user_abcdef123')).toBe('user***')
    })
  })

  describe('maskIp', () => {
    it('masks IPv4 to /24', () => {
      expect(maskIp('192.168.1.42')).toBe('192.168.1.0/24')
    })
    it('masks IPv6 to first 4 hextets', () => {
      expect(maskIp('2001:db8:85a3:8d3:1319:8a2e:370:7348')).toMatch(/^2001:db8:85a3:8d3::/)
    })
  })

  describe('maskName', () => {
    it('keeps first char + ***', () => {
      expect(maskName('홍길동')).toBe('홍***')
    })
  })

  describe('redactPii', () => {
    it('masks PII keys at any depth', () => {
      const input = {
        userId: 'user-12345',
        email: 'alice@example.com',
        nested: { name_ko: '김철수', other: 'safe' },
        list: [{ ip: '10.0.0.5' }],
      }
      const out = redactPii(input) as typeof input
      expect(out.userId).toBe('user***')
      expect(out.email).toBe('ali***@example.com')
      expect(out.nested.name_ko).toBe('김***')
      expect(out.nested.other).toBe('safe')
      expect(out.list[0].ip).toBe('10.0.0.0/24')
    })

    it('tolerates cycles', () => {
      const a: Record<string, unknown> = { foo: 'bar' }
      a.self = a
      expect(() => redactPii(a)).not.toThrow()
    })

    it('passes through primitives', () => {
      expect(redactPii('alice@example.com')).toBe('alice@example.com')
      expect(redactPii(42)).toBe(42)
      expect(redactPii(null)).toBeNull()
    })
  })

  describe('logger.error', () => {
    it('captures Error objects via Sentry', () => {
      const err = new Error('boom')
      logger.error(err, 'failed')
      expect(Sentry.captureException).toHaveBeenCalledWith(err)
      expect(Sentry.addBreadcrumb).toHaveBeenCalled()
    })

    it('captures string messages via Sentry.captureMessage', () => {
      logger.error('something went wrong')
      expect(Sentry.captureMessage).toHaveBeenCalledWith('something went wrong', 'error')
    })
  })

  describe('captureApiError (legacy wrapper)', () => {
    it('routes through Sentry for Error', () => {
      const err = new Error('legacy')
      captureApiError('GET /api/foo', err)
      expect(Sentry.captureException).toHaveBeenCalledWith(err)
    })

    it('handles non-Error values', () => {
      captureApiError('GET /api/bar', 'string error')
      expect(Sentry.captureMessage).toHaveBeenCalled()
    })
  })
})
