/**
 * illustrations — 인라인 SVG 일러스트 4종 (empty/error/success/onboarding).
 *
 * 디자인 원칙: 모노크롬 라인아트 + 단일 액센트(KWG teal). 장식 요소이므로
 * 소비처에서 `aria-hidden`. stroke는 currentColor(주변 텍스트색 상속),
 * 액센트만 `var(--color-primary)`. 하드코딩 hex 없음(디자인 토큰 규칙 준수).
 */
import * as React from 'react'

type Props = React.SVGProps<SVGSVGElement>

const base = {
  width: 72,
  height: 72,
  viewBox: '0 0 72 72',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

const accent = { stroke: 'var(--color-primary)' }

/** 검색 결과 없음 — 점선 카드 + 돋보기 */
export function EmptyIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="12" y="16" width="36" height="28" rx="3" strokeDasharray="4 4" opacity={0.7} />
      <line x1="19" y1="25" x2="33" y2="25" opacity={0.5} />
      <line x1="19" y1="32" x2="28" y2="32" opacity={0.5} />
      <circle cx="44" cy="44" r="10" {...accent} />
      <line x1="51" y1="51" x2="58" y2="58" {...accent} />
    </svg>
  )
}

/** 오류 — 경고 삼각형 */
export function ErrorIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M36 14 L60 56 H12 Z" opacity={0.7} />
      <line x1="36" y1="30" x2="36" y2="42" {...accent} />
      <circle cx="36" cy="49" r="1.4" fill="var(--color-primary)" stroke="none" />
    </svg>
  )
}

/** 성공 — 원 안의 체크 */
export function SuccessIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="36" cy="36" r="22" opacity={0.7} />
      <path d="M26 37 L33 44 L47 29" {...accent} />
    </svg>
  )
}

/** 온보딩 — 깃발 + 경로 단계 */
export function OnboardingIllustration(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="16" cy="52" r="3" opacity={0.6} />
      <circle cx="34" cy="40" r="3" opacity={0.6} />
      <path d="M16 52 L34 40 L50 22" strokeDasharray="3 4" opacity={0.6} />
      <line x1="50" y1="18" x2="50" y2="40" {...accent} />
      <path d="M50 19 L60 23 L50 27 Z" {...accent} />
    </svg>
  )
}
