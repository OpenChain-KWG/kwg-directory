/**
 * Rate limiting — Upstash Redis (sliding window) when env vars are set,
 * otherwise in-memory Map fallback (single-process, local dev).
 *
 * Public API is unchanged:  checkRateLimit(key, limit, windowMs)
 */

type RateLimitRecord = { count: number; resetAt: number }

const store = new Map<string, RateLimitRecord>()

function inMemoryCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = store.get(key) ?? { count: 0, resetAt: now + windowMs }

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  store.set(key, record)

  return record.count <= limit
}

/** Returns true when the request is allowed, false when rate-limited. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    try {
      // Dynamic import keeps Upstash out of the bundle when not configured.
      const { Redis } = await import('@upstash/redis')
      const { Ratelimit } = await import('@upstash/ratelimit')

      const redis = new Redis({ url: redisUrl, token: redisToken })
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
        prefix: 'kwg:rl',
      })

      const { success } = await ratelimit.limit(key)
      return success
    } catch (err) {
      // If Upstash is misconfigured or unavailable, fall back to in-memory.
      // Importing logger directly would create a potential circular dep at module init;
      // use the logger lazily via a dynamic reference instead.
      try {
        const { logger } = await import('@/lib/logger')
        logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'rate-limit Upstash error — falling back to in-memory',
        )
      } catch {
        // logger also unavailable — silently fall through
      }
      return inMemoryCheck(key, limit, windowMs)
    }
  }

  return inMemoryCheck(key, limit, windowMs)
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
