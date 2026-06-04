import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

// Pre-paint theme resolution (no FOUC): a stored choice wins; otherwise the OS
// `prefers-color-scheme` decides. Mirrors the persistence key used by ThemeToggle.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('kwg-theme');var d=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',d);}catch(e){}})();`
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// i18n-exempt: metadata description is global SEO copy; localized variants
// will arrive with [locale] routing in chunk 2.
export const metadata: Metadata = {
  title: 'OpenChain KWG Directory',
  description: 'OpenChain Korea Work Group 멤버 주소록 — 오픈소스 컴플라이언스 전문가 커뮤니티',
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }],
    shortcut: '/favicon-32x32.png',
    apple: '/favicon-32x32.png',
  },
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  /**
   * `@modal` parallel slot — populated by the intercepting route at
   * `app/@modal/(.)members/[id]/page.tsx` (Phase 3 트랙 D chunk 2). When no
   * route matches, `app/@modal/default.tsx` returns null so the slot is inert.
   */
  modal: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const nonce = (await headers()).get('x-csp-nonce') ?? undefined

  return (
    <html
      lang={locale}
      data-theme="light"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          {modal}
          <Footer />
          <Toaster position="bottom-center" richColors />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
