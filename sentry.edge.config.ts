import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  debug: false,
  beforeSend(event) {
    // PII 마스킹: 이메일 주소 패턴을 마스킹
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      if (typeof data.email === 'string') {
        data.email = maskEmail(data.email)
      }
    }
    return event
  },
})

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length > 3 ? local.slice(0, 3) + '***' : 'xxx***'
  return `${maskedLocal}@${domain}`
}
