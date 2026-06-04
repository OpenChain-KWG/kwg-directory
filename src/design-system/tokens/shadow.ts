/**
 * Shadow tokens.
 *
 * Per principles.md, borders are preferred for separation; shadow is reserved
 * for elevation cues (popover, dropdown, modal, hover lift).
 *
 * focusRing is a colored shadow used for keyboard focus — composed via the
 * --color-state-primary semantic token so dark mode adapts automatically.
 */

export const shadow = {
  xs:   '0 1px 2px 0 oklch(0% 0 0 / 0.04)',
  sm:   '0 1px 3px 0 oklch(0% 0 0 / 0.06), 0 1px 2px -1px oklch(0% 0 0 / 0.04)',
  md:   '0 4px 8px -2px oklch(0% 0 0 / 0.08), 0 2px 4px -2px oklch(0% 0 0 / 0.04)',
  lg:   '0 10px 16px -4px oklch(0% 0 0 / 0.10), 0 4px 6px -2px oklch(0% 0 0 / 0.04)',
  xl:   '0 20px 28px -6px oklch(0% 0 0 / 0.12), 0 8px 10px -4px oklch(0% 0 0 / 0.04)',
  '2xl':'0 28px 56px -12px oklch(0% 0 0 / 0.18)',
  inner:'inset 0 1px 2px 0 oklch(0% 0 0 / 0.06)',
  none: 'none',
  /** Keyboard focus ring; consumes the primary state color via CSS var. */
  focusRing: '0 0 0 3px var(--color-focus-ring)',
} as const

export type ShadowKey = keyof typeof shadow
