import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns 200 with status ok and required fields', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      status: string
      uptime: number
      timestamp: string
      version: string
    }
    expect(body.status).toBe('ok')
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThanOrEqual(0)
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(typeof body.version).toBe('string')
    expect(body.version.length).toBeGreaterThan(0)
  })
})
