import { Spinner } from '@/components/ui/Spinner'
import { getTranslations } from 'next-intl/server'

interface RouteLoadingProps {
  /** translation key under namespace `loadingPage` */
  messageKey: 'default' | 'admin' | 'profile' | 'privacy' | 'memberDetail'
  /** test id; defaults to `loading-{messageKey}` */
  testId?: string
}

export async function RouteLoading({ messageKey, testId }: RouteLoadingProps) {
  const t = await getTranslations('loadingPage')
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId ?? `loading-${messageKey}`}
      className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--color-text-muted)]"
    >
      <Spinner size="lg" aria-hidden />
      <p className="text-sm">{t(messageKey)}</p>
    </div>
  )
}
