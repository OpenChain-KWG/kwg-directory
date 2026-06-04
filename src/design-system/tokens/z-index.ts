/**
 * Z-index tokens — layering scale.
 *
 * Use named tokens, never raw numbers. The scale is intentionally sparse so
 * new layers can slot between existing ones without renumbering.
 */

export const zIndex = {
  base:     0,
  raised:   10,
  dropdown: 1000,
  sticky:   1100,
  overlay:  1200,
  modal:    1300,
  popover:  1400,
  toast:    1500,
  tooltip:  1600,
} as const

export type ZIndexKey = keyof typeof zIndex
