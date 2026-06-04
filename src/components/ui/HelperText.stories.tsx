import type { Meta, StoryObj } from '@storybook/react'

import { HelperText } from './HelperText'

const meta: Meta<typeof HelperText> = {
  title: 'UI/HelperText',
  component: HelperText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Use 8 or more characters with a mix of letters, numbers, and symbols.',
  },
}

export default meta
type Story = StoryObj<typeof HelperText>

export const Default: Story = {}

export const LongCopy: Story = {
  args: {
    children:
      'Helper text can wrap onto multiple lines. It is meant to provide guidance to the user about expected input format, validation rules, or related context.',
  },
}
