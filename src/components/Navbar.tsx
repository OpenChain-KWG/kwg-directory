// design-token-exempt: legacy GitHub/Google brand colors — to be replaced with
// dedicated social color tokens in Phase 4 Track D chunk 4.
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { auth, signIn, signOut } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/admin'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'
import { btnSocial, btnGhost } from '@/lib/button-styles'
import { NavbarMobileMenu, type NavbarMobileMenuLink } from '@/components/NavbarMobileMenu'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

async function AuthButton() {
  const t = await getTranslations('navbar')
  const session = await auth()

  if (session?.user) {
    const initials = getInitials(session.user.name ?? '?')
    const avatarColor = getAvatarColor(session.user.name ?? '')

    let hasMember = false
    let adminUser = false
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      hasMember = !!data
      adminUser = await isAdmin(session.user.id)
    } catch {
      // Supabase 미연결 시 무시
    }

    return (
      <div className="flex items-center gap-3">
        {hasMember ? (
          <Link
            href="/profile/edit"
            aria-label={t('editProfile')}
            data-testid="edit-profile-link"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>{t('editProfile')}</span>
          </Link>
        ) : (
          <Link
            href="/profile/new"
            aria-label={t('registerProfile')}
            data-testid="register-profile-link"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>{t('registerProfile')}</span>
          </Link>
        )}

        {adminUser && (
          <Link
            href="/admin"
            aria-label={t('adminLink')}
            data-testid="navbar-admin-link"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>{t('adminLink')}</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={t('userAvatarAlt', { name: session.user.name ?? '' })}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: avatarColor }}
              aria-label={t('userAvatarAlt', { name: session.user.name ?? '' })}
            >
              {initials}
            </div>
          )}
          <span className="hidden sm:block text-sm text-[var(--color-text-muted)]">
            {session.user.name}
          </span>
        </div>

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}
        >
          <button
            type="submit"
            data-testid="logout-btn"
            aria-label={t('logout')}
            className={cn(
              'text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
              btnGhost,
            )}
          >
            {t('logout')}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={t('loginGroupLabel')}>
      <form
        action={async () => {
          'use server'
          await signIn('github')
        }}
      >
        <button
          type="submit"
          title={t('loginGitHub')}
          aria-label={t('loginGitHub')}
          data-testid="navbar-login-github-btn"
          className={cn(
            // design-token-exempt: brand colors for GitHub OAuth — migrating to dedicated social tokens in chunk 4
            'flex items-center justify-center w-9 h-9 rounded-lg bg-[#24292e] hover:bg-[#1a1f24] text-white',
            btnSocial,
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </button>
      </form>
      <form
        action={async () => {
          'use server'
          await signIn('google')
        }}
      >
        <button
          type="submit"
          title={t('loginGoogle')}
          aria-label={t('loginGoogle')}
          data-testid="navbar-login-google-btn"
          className={cn(
            // design-token-exempt: Google brand colors
            'flex items-center justify-center w-9 h-9 rounded-lg bg-white hover:bg-gray-50 border border-[#dadce0]',
            btnSocial,
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default async function Navbar() {
  const t = await getTranslations('navbar')
  const session = await auth()

  let hasMember = false
  let adminUser = false
  if (session?.user) {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      hasMember = !!data
      adminUser = await isAdmin(session.user.id)
    } catch {
      // Supabase 미연결 시 무시
    }
  }

  const mobileLinks: NavbarMobileMenuLink[] = [
    { href: '/', labelKey: 'directoryLink', testId: 'navbar-mobile-directory' },
    { href: '/privacy', labelKey: 'privacyLink', testId: 'navbar-mobile-privacy' },
  ]
  if (session?.user) {
    if (hasMember) {
      mobileLinks.push({ href: '/profile/edit', labelKey: 'editProfile', testId: 'navbar-mobile-edit-profile' })
    } else {
      mobileLinks.push({ href: '/profile/new', labelKey: 'registerProfile', testId: 'navbar-mobile-register-profile' })
    }
    if (adminUser) {
      mobileLinks.push({ href: '/admin', labelKey: 'adminLink', testId: 'navbar-mobile-admin' })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
        aria-label={t('title')}
      >
        <div className="flex items-center gap-3">
          <NavbarMobileMenu links={mobileLinks} />
          <Link href="/" aria-label={t('logoAlt')} className="flex items-center gap-2">
            {/* 모바일 */}
            <Image
              src="/kwg-logo.png"
              alt={t('logoAlt')}
              width={28}
              height={28}
              className="sm:hidden"
              data-testid="mobile-logo"
              priority
            />
            {/* 데스크톱 */}
            <Image
              src="/kwg-logo.png"
              alt={t('logoAlt')}
              width={40}
              height={40}
              style={{ width: 'auto', height: '40px' }}
              className="hidden sm:block"
              priority
            />
            <span className="font-semibold text-base text-[var(--color-text)] hidden sm:inline">
              {t('title')}
            </span>
          </Link>
          <ul className="hidden md:flex items-center gap-4 ml-4">
            <li>
              <Link
                href="/privacy"
                data-testid="navbar-privacy-link"
                className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                {t('privacyLink')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <LocaleSwitcher />
          <AuthButton />
        </div>
      </nav>
    </header>
  )
}
