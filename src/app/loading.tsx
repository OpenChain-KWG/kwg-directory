import { Spinner } from '@/components/ui/Spinner'
import { getTranslations } from 'next-intl/server'

export default async function RootLoading() {
  const t = await getTranslations('loadingPage')
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="loading-default"
      className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--color-text-muted)]"
    >
      <Spinner size="lg" aria-hidden />
      <p className="text-sm">{t('default')}</p>
    </div>
  )
}
