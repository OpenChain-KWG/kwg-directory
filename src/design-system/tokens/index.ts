/**
 * Design tokens — single barrel export.
 *
 * Components MUST import tokens from here, never from individual files,
 * so the surface area stays explicit. The CSS layer (globals.css) mirrors
 * these tokens as CSS custom properties for Tailwind v4 @theme consumption.
 */

export {
  colorScales,
  semanticColors,
  type ColorHue,
  type ColorStep,
  type SemanticColors,
} from './color'

export {
  fontFamily,
  fontWeight,
  fontSize,
  typographyRoles,
  type FontFamily,
  type FontWeight,
  type FontSize,
  type TypographyRole,
} from './typography'

export {
  spacing,
  type SpacingKey,
} from './spacing'

export {
  radius,
  type RadiusKey,
} from './radius'

export {
  shadow,
  type ShadowKey,
} from './shadow'

export {
  duration,
  easing,
  motion,
  type Duration,
  type Easing,
  type MotionPreset,
} from './motion'

export {
  zIndex,
  type ZIndexKey,
} from './z-index'
