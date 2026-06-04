/**
 * Next.js proxy (middleware) — auth guards + CSP nonce injection.
 *
 * CSP nonce mode:
 *   default: Content-Security-Policy-Report-Only (safe 1-week monitoring)
 *   NEXT_PUBLIC_FF_CSP_ENFORCE=on → enforcing Content-Security-Policy
 *
 * The nonce is forwarded to Server Components via the `x-csp-nonce`
 * request header so inline scripts can be stamped.
 */

import { auth } from '@/auth'
import { NextResponse, type NextRequest } from 'next/server'

function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64')
}

function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    // nonce replaces unsafe-inline; unsafe-eval retained for Next.js build
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://avatars.githubusercontent.com https://*.supabase.co https://lh3.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
  ]
  return directives.join('; ')
}

export default auth((req: NextRequest & { auth?: unknown }) => {
  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  const isAuthenticated = !!(req as { auth?: unknown }).auth
  const pathname = req.nextUrl.pathname

  // ─── Auth guards ───────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/', req.url))
    applyCspHeaders(response, csp, nonce)
    return response
  }

  if (pathname.startsWith('/profile') && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/', req.url))
    applyCspHeaders(response, csp, nonce)
    return response
  }

  // ─── Pass through with nonce ────────────────────────────────────
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers),
        'x-csp-nonce': nonce,
      }),
    },
  })

  applyCspHeaders(response, csp, nonce)
  return response
})

function applyCspHeaders(response: NextResponse, csp: string, nonce: string): void {
  const enforce = process.env.NEXT_PUBLIC_FF_CSP_ENFORCE === 'on'
  const cspHeader = enforce
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only'

  response.headers.set(cspHeader, csp)
  response.headers.set('x-csp-nonce', nonce)
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
}
