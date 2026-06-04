/**
 * format.ts — 로케일 인지 날짜·숫자 포맷 유틸 (Intl 기반).
 *
 * 하드코딩된 `toLocaleDateString('ko-KR')` 류를 대체한다. 클라이언트 컴포넌트에서는
 * next-intl `useLocale()` 로 활성 로케일을 받아 인자로 넘긴다.
 *
 * 옵션을 생략하면 로케일 기본 단축 형식(기존 ko 출력과 동일)을 유지하면서
 * en 로케일에서도 올바른 형식을 낸다.
 */

/** ISO 문자열 또는 Date → 로케일 날짜 문자열. 잘못된 입력은 빈 문자열. */
export function formatDate(
  input: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (input == null) return ''
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/** 숫자 → 로케일 숫자 문자열(천 단위 구분 등). 비유한값은 빈 문자열. */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  if (!Number.isFinite(value)) return ''
  return new Intl.NumberFormat(locale, options).format(value)
}
