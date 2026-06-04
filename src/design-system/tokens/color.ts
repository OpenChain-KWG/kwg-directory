/**
 * Color tokens — OKLCH 9-step scales × 6 hues + semantic aliases
 *
 * Each scale: 50/100/200/300/400/500/600/700/800/900
 *  - 50  : surface tint (lightest)
 *  - 500 : base (canonical brand step)
 *  - 900 : highest contrast text-on-light
 *
 * OKLCH chosen for perceptual uniformity. Browser support:
 *   Safari 15.4+, Chrome 111+, Firefox 113+. Hex fallbacks live in globals.css.
 *
 * KWG primary anchor: #01696f (teal) ≈ oklch(45.5% 0.072 192).
 *
 * Hues:
 *   gray    — neutral surfaces, text, borders
 *   primary — KWG teal (single accent)
 *   success — confirmation
 *   warning — caution
 *   danger  — destructive / error
 *   info    — informational notice
 */

export const colorScales = {
  gray: {
    50:  'oklch(98.5% 0.002 247)',
    100: 'oklch(96.5% 0.003 247)',
    200: 'oklch(92.5% 0.005 247)',
    300: 'oklch(86.0% 0.008 247)',
    400: 'oklch(70.0% 0.012 247)',
    500: 'oklch(55.5% 0.014 247)',
    600: 'oklch(44.0% 0.014 247)',
    700: 'oklch(36.0% 0.012 247)',
    800: 'oklch(26.5% 0.010 247)',
    900: 'oklch(18.0% 0.008 247)',
  },
  primary: {
    50:  'oklch(97.0% 0.012 192)',
    100: 'oklch(93.0% 0.025 192)',
    200: 'oklch(85.5% 0.045 192)',
    300: 'oklch(75.0% 0.060 192)',
    400: 'oklch(62.0% 0.068 192)',
    500: 'oklch(45.5% 0.072 192)',
    600: 'oklch(38.5% 0.064 192)',
    700: 'oklch(31.5% 0.054 192)',
    800: 'oklch(24.5% 0.042 192)',
    900: 'oklch(18.0% 0.030 192)',
  },
  success: {
    50:  'oklch(97.5% 0.018 152)',
    100: 'oklch(93.5% 0.040 152)',
    200: 'oklch(86.0% 0.080 152)',
    300: 'oklch(76.5% 0.120 152)',
    400: 'oklch(66.0% 0.150 152)',
    500: 'oklch(56.0% 0.150 152)',
    600: 'oklch(47.0% 0.130 152)',
    700: 'oklch(38.5% 0.105 152)',
    800: 'oklch(30.5% 0.080 152)',
    900: 'oklch(22.5% 0.055 152)',
  },
  warning: {
    50:  'oklch(98.0% 0.020 85)',
    100: 'oklch(95.0% 0.045 85)',
    200: 'oklch(89.5% 0.090 85)',
    300: 'oklch(83.0% 0.130 85)',
    400: 'oklch(76.0% 0.155 85)',
    500: 'oklch(68.0% 0.160 85)',
    600: 'oklch(56.5% 0.140 85)',
    700: 'oklch(45.5% 0.115 85)',
    800: 'oklch(35.5% 0.090 85)',
    900: 'oklch(26.5% 0.065 85)',
  },
  danger: {
    50:  'oklch(97.5% 0.015 25)',
    100: 'oklch(93.5% 0.038 25)',
    200: 'oklch(86.5% 0.080 25)',
    300: 'oklch(77.5% 0.130 25)',
    400: 'oklch(68.0% 0.175 25)',
    500: 'oklch(58.0% 0.200 25)',
    600: 'oklch(48.5% 0.180 25)',
    700: 'oklch(40.0% 0.150 25)',
    800: 'oklch(31.5% 0.118 25)',
    900: 'oklch(23.5% 0.085 25)',
  },
  info: {
    50:  'oklch(97.5% 0.015 240)',
    100: 'oklch(93.5% 0.035 240)',
    200: 'oklch(86.5% 0.075 240)',
    300: 'oklch(77.5% 0.115 240)',
    400: 'oklch(68.0% 0.150 240)',
    500: 'oklch(56.5% 0.165 240)',
    600: 'oklch(47.5% 0.150 240)',
    700: 'oklch(39.0% 0.125 240)',
    800: 'oklch(30.5% 0.095 240)',
    900: 'oklch(22.5% 0.065 240)',
  },
} as const

export type ColorHue = keyof typeof colorScales
export type ColorStep = keyof typeof colorScales['gray']

/**
 * Semantic aliases — consume in components instead of raw scale steps.
 * Use these names with Tailwind classes via globals.css mapping.
 */
export const semanticColors = {
  bg: {
    surface:        'var(--color-bg-surface)',
    surfaceAlt:     'var(--color-bg-surface-alt)',
    surfaceMuted:   'var(--color-bg-surface-muted)',
    surfaceInverse: 'var(--color-bg-surface-inverse)',
    overlay:        'var(--color-bg-overlay)',
  },
  text: {
    DEFAULT: 'var(--color-text-default)',
    muted:   'var(--color-text-muted)',
    faint:   'var(--color-text-faint)',
    inverse: 'var(--color-text-inverse)',
    link:    'var(--color-text-link)',
    onBrand: 'var(--color-text-on-brand)',
  },
  border: {
    subtle: 'var(--color-border-subtle)',
    DEFAULT:'var(--color-border-default)',
    strong: 'var(--color-border-strong)',
    focus:  'var(--color-border-focus)',
  },
  state: {
    primary: 'var(--color-state-primary)',
    success: 'var(--color-state-success)',
    warning: 'var(--color-state-warning)',
    danger:  'var(--color-state-danger)',
    info:    'var(--color-state-info)',
  },
} as const

export type SemanticColors = typeof semanticColors
