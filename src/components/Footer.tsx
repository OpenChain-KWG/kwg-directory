import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Separator } from '@/components/ui/Separator'

interface FooterLink {
  href: string
  labelKey: 'directory' | 'kwgSite' | 'github' | 'privacy'
  external?: boolean
  testId?: string
}

const PROJECT_LINKS: FooterLink[] = [
  { href: '/', labelKey: 'directory', testId: 'footer-directory-link' },
  {
    href: 'https://openchain-project.github.io/OpenChain-KWG/',
    labelKey: 'kwgSite',
    external: true,
    testId: 'footer-kwg-site-link',
  },
  {
    href: 'https://github.com/OpenChain-KWG/kwg-directory',
    labelKey: 'github',
    external: true,
    testId: 'footer-github-link',
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { href: '/privacy', labelKey: 'privacy', testId: 'footer-privacy-link' },
]

export default async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  const renderLink = (link: FooterLink) => {
    const className =
      'text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-sm'
    if (link.external) {
      return (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={link.testId}
          className={className}
        >
          {t(`links.${link.labelKey}`)}
        </a>
      )
    }
    return (
      <Link
        key={link.href}
        href={link.href}
        data-testid={link.testId}
        className={className}
      >
        {t(`links.${link.labelKey}`)}
      </Link>
    )
  }

  return (
    <footer
      className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      data-testid="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-semibold text-[var(--color-text)]">{t('projectName')}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('projectTagline')}</p>
          </div>

          <nav aria-label={t('navAriaLabel')}>
            <p className="font-medium text-sm text-[var(--color-text)] mb-3">
              {t('columns.links')}
            </p>
            <ul className="flex flex-col gap-2">
              {PROJECT_LINKS.map((link) => (
                <li key={link.href}>{renderLink(link)}</li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-medium text-sm text-[var(--color-text)] mb-3">
              {t('columns.legal')}
            </p>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
          <p>{t('copyright', { year })}</p>
          <p>{t('memberOnlyNotice')}</p>
        </div>
      </div>
    </footer>
  )
}
