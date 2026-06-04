/**
 * next-intl request config.
 *
 * Locale resolution (no URL routing — the app is noindex/login-gated, so a
 * `[locale]` segment adds cost without SEO benefit): the active locale is read
 * from the `NEXT_LOCALE` cookie set by the in-app LocaleSwitcher, falling back
 * to the default locale (`ko`).
 *
 * @see https://next-intl.dev/docs/usage/configuration#i18n-request
 */

import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, isValidLocale, type Locale } from './routing'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const requested = cookieStore.get(LOCALE_COOKIE)?.value
  const locale: Locale =
    requested && isValidLocale(requested) ? requested : defaultLocale

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
