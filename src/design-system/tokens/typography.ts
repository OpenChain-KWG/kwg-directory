/**
 * Typography tokens — Pretendard Variable + JetBrains Mono.
 *
 * Per ADR-0002:
 *  - Pretendard is the canonical/loaded webfont, unified for body and
 *    headings (weight expresses hierarchy).
 *  - Mono (JetBrains Mono) for code, identifiers, log output.
 *  - Instrument Serif and Noto Sans KR are removed as canonical fonts.
 *    "Noto Sans KR"/"Malgun Gothic" remain only as trailing *OS fallbacks*
 *    in the `sans` stack (used when Pretendard fails to load); they are not
 *    loaded webfonts and carry no design role.
 *
 * Sizes follow a 13-step ratio scale with paired line-height and
 * letter-spacing — consume the pair, not raw size, to keep rhythm.
 */

export const fontFamily = {
  sans: [
    'Pretendard Variable',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Roboto',
    '"Helvetica Neue"',
    '"Segoe UI"',
    '"Apple SD Gothic Neo"',
    '"Noto Sans KR"',
    '"Malgun Gothic"',
    'sans-serif',
  ].join(', '),
  mono: [
    '"JetBrains Mono"',
    '"SF Mono"',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    'monospace',
  ].join(', '),
} as const

export const fontWeight = {
  thin:       100,
  extralight: 200,
  light:      300,
  regular:    400,
  medium:     500,
  semibold:   600,
  bold:       700,
  extrabold:  800,
  black:      900,
} as const

/**
 * Size scale — paired with lineHeight + letterSpacing.
 * Values in rem (root 16px). 13 steps: xs → 9xl.
 */
export const fontSize = {
  xs:   { size: '0.75rem',  lineHeight: '1rem',     letterSpacing: '0.005em' }, // 12 / 16
  sm:   { size: '0.875rem', lineHeight: '1.25rem',  letterSpacing: '0' },        // 14 / 20
  base: { size: '1rem',     lineHeight: '1.5rem',   letterSpacing: '0' },        // 16 / 24
  lg:   { size: '1.125rem', lineHeight: '1.75rem',  letterSpacing: '-0.005em' }, // 18 / 28
  xl:   { size: '1.25rem',  lineHeight: '1.875rem', letterSpacing: '-0.01em' },  // 20 / 30
  '2xl':{ size: '1.5rem',   lineHeight: '2rem',     letterSpacing: '-0.015em' }, // 24 / 32
  '3xl':{ size: '1.875rem', lineHeight: '2.375rem', letterSpacing: '-0.02em' },  // 30 / 38
  '4xl':{ size: '2.25rem',  lineHeight: '2.75rem',  letterSpacing: '-0.022em' }, // 36 / 44
  '5xl':{ size: '3rem',     lineHeight: '3.5rem',   letterSpacing: '-0.025em' }, // 48 / 56
  '6xl':{ size: '3.75rem',  lineHeight: '4.25rem',  letterSpacing: '-0.03em' },  // 60 / 68
  '7xl':{ size: '4.5rem',   lineHeight: '5rem',     letterSpacing: '-0.032em' }, // 72 / 80
  '8xl':{ size: '6rem',     lineHeight: '6.5rem',   letterSpacing: '-0.035em' }, // 96 / 104
  '9xl':{ size: '8rem',     lineHeight: '8.5rem',   letterSpacing: '-0.04em' },  // 128 / 136
} as const

export type FontFamily = keyof typeof fontFamily
export type FontWeight = keyof typeof fontWeight
export type FontSize   = keyof typeof fontSize

/** Convenience aliases for common UI roles. */
export const typographyRoles = {
  display: { size: '5xl', weight: 'bold'     },
  h1:      { size: '4xl', weight: 'bold'     },
  h2:      { size: '3xl', weight: 'semibold' },
  h3:      { size: '2xl', weight: 'semibold' },
  h4:      { size: 'xl',  weight: 'semibold' },
  body:    { size: 'base',weight: 'regular'  },
  caption: { size: 'sm',  weight: 'regular'  },
  micro:   { size: 'xs',  weight: 'medium'   },
} as const

export type TypographyRole = keyof typeof typographyRoles
