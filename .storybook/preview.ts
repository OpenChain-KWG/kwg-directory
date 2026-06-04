import type { Preview } from '@storybook/react'
import { withThemeByDataAttribute } from '@storybook/addon-themes'

import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: 'oklch(98.5% 0.002 247)' },
        { name: 'surface-dark', value: 'oklch(18.0% 0.008 247)' },
      ],
    },
    a11y: {
      // Run axe automatically and surface violations.
      test: 'todo',
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
  tags: ['autodocs'],
}

export default preview
