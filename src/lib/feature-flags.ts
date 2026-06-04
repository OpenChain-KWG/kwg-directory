/**
 * Feature flag 헬퍼 — v2 개편 점진 롤아웃용.
 *
 * 사용 패턴:
 *   if (isEnabled('newProfileForm')) { ... }
 *
 * 환경변수: NEXT_PUBLIC_FF_<UPPER_SNAKE>=on|off
 *   예) NEXT_PUBLIC_FF_NEW_PROFILE_FORM=on
 *
 * 빌드타임에 트리쉐이킹되도록 NEXT_PUBLIC_* 만 사용.
 * 서버·클라이언트 양쪽에서 안전하게 호출 가능.
 */

export type FeatureFlag =
  | 'newProfileForm'
  | 'newAdminTable'
  | 'commandMenu'
  | 'i18n'
  | 'sentry'
  | 'visualRegression'

const camelToScreamingSnake = (s: string): string =>
  s.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()

export function isEnabled(flag: FeatureFlag): boolean {
  const envKey = `NEXT_PUBLIC_FF_${camelToScreamingSnake(flag)}`
  const value = process.env[envKey]
  return value === 'on' || value === 'true' || value === '1'
}

/** 여러 flag을 객체로 반환 — 컴포넌트에서 한 번에 분기할 때 */
export function flags<K extends FeatureFlag>(...keys: K[]): Record<K, boolean> {
  return keys.reduce(
    (acc, k) => {
      acc[k] = isEnabled(k)
      return acc
    },
    {} as Record<K, boolean>,
  )
}
