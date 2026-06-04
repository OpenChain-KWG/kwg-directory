/**
 * next-intl routing configuration.
 *
 * Phase 4 — Track D chunk 1 (Option C):
 *   Single locale (ko) bootstrap. The `[locale]` URL segment is intentionally
 *   not introduced yet; switching between ko/en is achieved via the request
 *   config below until the user-facing locale toggle lands in chunk 2+.
 *
 *   Once routing is enabled, this file will be consumed by next-intl's
 *   middleware to map URL prefixes to locales.
 *
 * @see https://next-intl.dev/docs/getting-started/app-router
 */

export const locales = ['ko', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ko'

export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
