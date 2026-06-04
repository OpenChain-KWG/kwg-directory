// PostgREST `.or()` 필터 문자열에 사용자 입력을 안전하게 끼워넣는 공유 헬퍼.
// 검색어를 raw 보간하면 콤마·점·괄호 등 PostgREST 예약문자가 logic tree로
// 해석되어 (1) 임의 컬럼 필터 주입(예: email.ilike.* 로 비공개 값 enumeration)과
// (2) 콤마 포함 검색어의 파싱 실패(500)가 발생한다. (BUG-003)
//
// 방어: 필터 값을 큰따옴표로 감싸 통째로 하나의 리터럴 값으로 만들고,
// 값 내부의 백슬래시·큰따옴표만 이스케이프한다. 큰따옴표로 감싼 값 안의
// 예약문자(`,` `.` `(` `)` `:` 등)는 PostgREST가 값의 일부로 취급한다.

/**
 * 큰따옴표로 감싼 PostgREST 필터 값에 안전하도록 입력을 이스케이프한다.
 * 백슬래시(`\` → `\\`)와 큰따옴표(`"` → `\"`)만 처리한다.
 */
export function escapePostgrestFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * 여러 컬럼에 대한 ILIKE OR 필터 문자열을 안전하게 조립한다.
 * 각 컬럼은 `col.ilike."%<escaped term>%"` 형태가 되며, term의 예약문자는
 * 큰따옴표 인용으로 무력화된다.
 *
 * @example
 * buildIlikeOrFilter(['name_ko', 'company'], '삼성, LG')
 * // → 'name_ko.ilike."%삼성, LG%",company.ilike."%삼성, LG%"'
 */
export function buildIlikeOrFilter(columns: string[], term: string): string {
  const value = `"%${escapePostgrestFilterValue(term)}%"`
  return columns.map((col) => `${col}.ilike.${value}`).join(',')
}
