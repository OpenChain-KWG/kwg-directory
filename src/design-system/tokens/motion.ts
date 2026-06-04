/**
 * Motion tokens — duration + easing + composed presets.
 *
 * Per ADR-0002 / principles.md:
 *   - default duration ≤ 200ms; >300ms only with deliberate intent.
 *   - ease-out family for natural deceleration.
 *   - prefers-reduced-motion is enforced at the call site.
 */

export const duration = {
  instant: '0ms',
  fast:    '100ms',
  normal:  '200ms',
  slow:    '300ms',
  slower:  '500ms',
} as const

export const easing = {
  linear:        'linear',
  easeOutQuad:   'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeOutCubic:  'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeOutExpo:   'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut:     'cubic-bezier(0.4, 0, 0.2, 1)',
  spring:        'cubic-bezier(0.5, 1.25, 0.75, 1.25)',
} as const

/** Common motion presets. */
export const motion = {
  fadeIn:      `${duration.normal} ${easing.easeOutCubic}`,
  fadeOut:     `${duration.fast} ${easing.easeOutCubic}`,
  slideIn:     `${duration.slow} ${easing.easeOutExpo}`,
  slideOut:    `${duration.normal} ${easing.easeOutCubic}`,
  popoverIn:   `${duration.fast} ${easing.easeOutQuad}`,
  popoverOut:  `${duration.fast} ${easing.easeOutQuad}`,
} as const

export type Duration = keyof typeof duration
export type Easing   = keyof typeof easing
export type MotionPreset = keyof typeof motion
