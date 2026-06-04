/**
 * 공통 버튼 인터랙션 스타일 상수
 * 모든 버튼의 hover / active / focus 효과를 일관되게 유지합니다.
 * cn() 에 spread 하거나 문자열 보간으로 사용하세요.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(1,105,111,0.3)]'

/** 모든 버튼 공통 베이스 (transition + cursor + select-none + focus ring) */
export const btnBase = `cursor-pointer transition-all duration-150 ease-in-out select-none ${focusRing}`

/** Primary 버튼 — 등록·저장·승인 등 주요 액션 */
export const btnPrimary = `${btnBase} hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-none active:translate-y-0`

/** Secondary 버튼 — 이전·취소·돌아가기 등 보조 액션 */
export const btnSecondary = `${btnBase} hover:-translate-y-0.5 hover:shadow-sm active:scale-95 active:translate-y-0`

/** 소셜 로그인 버튼 — GitHub, Google */
export const btnSocial = `${btnBase} hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:shadow-none active:translate-y-0`

/** 아이콘 전용 버튼 — 닫기, 검색 아이콘 등 */
export const btnIcon = `${btnBase} active:scale-95`

/** Destructive 버튼 — 삭제·거절·탈퇴 등 빨간 계열 */
export const btnDestructive = `${btnBase} hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-none active:translate-y-0`

/** Ghost / 텍스트 버튼 — 로그아웃, 링크 스타일 */
export const btnGhost = `${btnBase} active:scale-95`
