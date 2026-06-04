import { getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/patterns/PageHeader'

type SectionId =
  | 'collection'
  | 'purpose'
  | 'retention'
  | 'thirdParty'
  | 'processors'
  | 'rights'
  | 'withdraw'
  | 'officer'
  | 'changes'

const SECTION_IDS: SectionId[] = [
  'collection',
  'purpose',
  'retention',
  'thirdParty',
  'processors',
  'rights',
  'withdraw',
  'officer',
  'changes',
]

interface SectionConfig {
  id: SectionId
  /** Optional renderer for the body of the section. */
  hasIntro?: boolean
  hasItems?: boolean
  hasOutro?: boolean
  hasBody?: boolean
  hasTable?: boolean
  hasOfficer?: boolean
}

const SECTIONS: Record<SectionId, SectionConfig> = {
  collection:  { id: 'collection',  hasIntro: true,  hasItems: true },
  purpose:     { id: 'purpose',     hasItems: true },
  retention:   { id: 'retention',   hasBody: true },
  thirdParty:  { id: 'thirdParty',  hasBody: true },
  processors:  { id: 'processors',  hasTable: true },
  rights:      { id: 'rights',      hasIntro: true,  hasItems: true, hasOutro: true },
  withdraw:    { id: 'withdraw',    hasBody: true },
  officer:     { id: 'officer',     hasOfficer: true },
  changes:     { id: 'changes',     hasBody: true },
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy')
  const tToc = (id: SectionId) => t(`sections.${id}.title`)
  const tSlug = (id: SectionId) => t(`sections.${id}.id`)

  return (
    <div className="animate-page-enter max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        data-testid="privacy-page-header"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[14rem_1fr] gap-10">
        <aside aria-label={t('tocAriaLabel')} data-testid="privacy-toc">
          <nav className="lg:sticky lg:top-20">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              {t('tocTitle')}
            </p>
            <ol className="flex flex-col gap-1.5 text-sm">
              {SECTION_IDS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${tSlug(id)}`}
                    className="block rounded-md px-2 py-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-alt)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                  >
                    {tToc(id)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-prose space-y-10 text-[var(--color-text)]">
          <p className="text-sm text-[var(--color-text-muted)]" data-testid="privacy-last-updated">
            {t('lastUpdated', { date: t('lastUpdatedDate') })}
          </p>

          {SECTION_IDS.map((id) => {
            const config = SECTIONS[id]
            return (
              <section
                key={id}
                id={tSlug(id)}
                aria-labelledby={`${tSlug(id)}-heading`}
                className="scroll-mt-24"
                data-testid={`privacy-section-${id}`}
              >
                <h2
                  id={`${tSlug(id)}-heading`}
                  className="text-lg font-semibold text-[var(--color-text)] mb-3"
                >
                  {tToc(id)}
                </h2>
                {config.hasIntro && (
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {t(`sections.${id}.intro`)}
                  </p>
                )}
                {config.hasItems && (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)] list-disc list-inside">
                    {(t.raw(`sections.${id}.items`) as string[]).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
                {config.hasOutro && (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    {t(`sections.${id}.outro`)}
                  </p>
                )}
                {config.hasBody && (
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {t(`sections.${id}.body`)}
                  </p>
                )}
                {config.hasTable && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[var(--color-surface-alt)]">
                          <th className="text-left px-4 py-2 border border-[var(--color-border)] font-medium">
                            {t(`sections.${id}.tableHeaders.vendor`)}
                          </th>
                          <th className="text-left px-4 py-2 border border-[var(--color-border)] font-medium">
                            {t(`sections.${id}.tableHeaders.purpose`)}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--color-text-muted)]">
                        {(t.raw(`sections.${id}.rows`) as Array<{ vendor: string; purpose: string }>).map(
                          (row, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 border border-[var(--color-border)]">{row.vendor}</td>
                              <td className="px-4 py-2 border border-[var(--color-border)]">{row.purpose}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {config.hasOfficer && (
                  <div className="bg-[var(--color-surface-alt)] rounded-xl p-4 text-sm text-[var(--color-text-muted)]">
                    <p>
                      <span className="font-medium text-[var(--color-text)]">
                        {t(`sections.${id}.roleLabel`)}:{' '}
                      </span>
                      {t(`sections.${id}.roleValue`)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-[var(--color-text)]">
                        {t(`sections.${id}.emailLabel`)}:{' '}
                      </span>
                      <a
                        href={`mailto:${t(`sections.${id}.emailValue`)}`}
                        className="text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-sm"
                      >
                        {t(`sections.${id}.emailValue`)}
                      </a>
                    </p>
                  </div>
                )}
              </section>
            )
          })}
        </article>
      </div>
    </div>
  )
}
