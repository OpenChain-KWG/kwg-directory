/**
 * Structured logger — pino-based on Node runtime, console fallback on Edge.
 *
 * @rules/observability-logging.md enforces this as the only logging path.
 * PII keys are masked before serialization. Error-level entries also flow
 * to Sentry as breadcrumbs + captureException.
 *
 * NOTE: this module is exempt from the `no-console` PreToolUse hook because
 * it is the logger implementation itself.
 */

import * as Sentry from '@sentry/nextjs'

const PII_KEYS = new Set([
  'email',
  'name',
  'name_ko',
  'name_en',
  'user_id',
  'userId',
  'id',
  'ip',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at <= 0) return 'xxx***'
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  const head = local.length > 3 ? local.slice(0, 3) : 'xxx'
  return `${head}***@${domain}`
}

export function maskId(value: string): string {
  if (UUID_RE.test(value)) return `${value.slice(0, 4)}***`
  if (value.length <= 4) return '***'
  return `${value.slice(0, 4)}***`
}

export function maskIp(value: string): string {
  // IPv4: keep /24, IPv6: keep first 4 hextets
  if (value.includes('.')) {
    const parts = value.split('.')
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
  }
  if (value.includes(':')) {
    const parts = value.split(':')
    return `${parts.slice(0, 4).join(':')}::***`
  }
  return '***'
}

export function maskName(value: string): string {
  if (!value) return '***'
  return `${value.slice(0, 1)}***`
}

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (key === 'email') return maskEmail(value)
  if (key === 'ip') return maskIp(value)
  if (key === 'name' || key === 'name_ko' || key === 'name_en') return maskName(value)
  if (key === 'id' || key === 'user_id' || key === 'userId') return maskId(value)
  return value
}

/** Recursively redact PII keys in a payload. Cycles are tolerated. */
export function redactPii(input: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (input === null || input === undefined) return input
  if (typeof input !== 'object') return input
  if (seen.has(input as object)) return '[Circular]'
  seen.add(input as object)

  if (Array.isArray(input)) {
    return input.map((v) => redactPii(v, seen))
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (PII_KEYS.has(k) && typeof v === 'string') {
      out[k] = maskValue(k, v)
    } else if (v && typeof v === 'object') {
      out[k] = redactPii(v, seen)
    } else {
      out[k] = v
    }
  }
  return out
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

function configuredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || '').toLowerCase()
  if (env in LEVEL_ORDER) return env as LogLevel
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info'
}

export interface Logger {
  trace(payload: object | string, message?: string): void
  debug(payload: object | string, message?: string): void
  info(payload: object | string, message?: string): void
  warn(payload: object | string, message?: string): void
  error(payload: object | string | Error, message?: string): void
  fatal(payload: object | string | Error, message?: string): void
}

const isEdge =
  typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge'

function buildEntry(
  level: LogLevel,
  payload: object | string | Error,
  message?: string,
): { entry: Record<string, unknown>; msg: string; err?: Error } {
  let entry: Record<string, unknown> = { level, time: Date.now() }
  let msg = message ?? ''
  let err: Error | undefined

  if (payload instanceof Error) {
    err = payload
    entry = {
      ...entry,
      err: { name: payload.name, message: payload.message, stack: payload.stack },
    }
    if (!msg) msg = payload.message
  } else if (typeof payload === 'string') {
    if (!msg) msg = payload
  } else {
    entry = { ...entry, ...(redactPii(payload) as Record<string, unknown>) }
  }
  entry.msg = msg
  return { entry, msg, err }
}

function emitConsoleFallback(level: LogLevel, entry: Record<string, unknown>): void {
  // logger-internal: no-console rule exempt
  const line = JSON.stringify(entry)
  // eslint-disable-next-line no-console
  if (level === 'error' || level === 'fatal') console.error(line)
  // eslint-disable-next-line no-console
  else if (level === 'warn') console.warn(line)
  // eslint-disable-next-line no-console
  else console.log(line)
}

function pinoLogger(): Logger | null {
  if (isEdge) return null
  try {
    // dynamic require avoids edge bundling
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pinoModule = require('pino') as ((opts: unknown) => unknown) & { default?: (opts: unknown) => unknown }
    const pino = pinoModule.default ?? pinoModule
    const base = pino({
      level: configuredLevel(),
      redact: {
        paths: [
          'email',
          '*.email',
          '*.*.email',
          'name',
          '*.name',
          'name_ko',
          '*.name_ko',
          'name_en',
          '*.name_en',
          'user_id',
          '*.user_id',
          'userId',
          '*.userId',
          'id',
          '*.id',
          'ip',
          '*.ip',
        ],
        censor: (value: unknown, path: string[]) => {
          const key = path[path.length - 1]
          return maskValue(key, value)
        },
      },
    })
    return base as unknown as Logger
  } catch {
    return null
  }
}

const pinoInstance = pinoLogger()

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel()]
}

function logAt(level: LogLevel, payload: object | string | Error, message?: string): void {
  if (!shouldLog(level)) return
  const { entry, msg, err } = buildEntry(level, payload, message)

  if (pinoInstance) {
    const fn = (pinoInstance as unknown as Record<LogLevel, (...args: unknown[]) => void>)[level]
    if (typeof payload === 'object' && !(payload instanceof Error)) {
      fn.call(pinoInstance, redactPii(payload), msg)
    } else if (payload instanceof Error) {
      fn.call(pinoInstance, { err: payload }, msg)
    } else {
      fn.call(pinoInstance, msg)
    }
  } else {
    emitConsoleFallback(level, entry)
  }

  if (level === 'error' || level === 'fatal') {
    Sentry.addBreadcrumb({ category: 'logger', level, message: msg, data: entry })
    if (err) Sentry.captureException(err)
    else Sentry.captureMessage(msg, level === 'fatal' ? 'fatal' : 'error')
  }
}

export const logger: Logger = {
  trace: (p, m) => logAt('trace', p, m),
  debug: (p, m) => logAt('debug', p, m),
  info: (p, m) => logAt('info', p, m),
  warn: (p, m) => logAt('warn', p, m),
  error: (p, m) => logAt('error', p, m),
  fatal: (p, m) => logAt('fatal', p, m),
}

/**
 * Legacy wrapper preserved for backward compatibility with API routes that
 * predate the structured logger. New code should call `logger.error` directly.
 */
export function captureApiError(route: string, error: unknown): void {
  if (error instanceof Error) {
    logger.error(error, `[${route}] ${error.message}`)
  } else {
    logger.error({ route, error: String(error) }, `[${route}] error`)
  }
}
