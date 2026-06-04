import type { Meta, StoryObj } from '@storybook/react'

import { ErrorMessage } from './ErrorMessage'

const meta: Meta<typeof ErrorMessage> = {
  title: 'UI/ErrorMessage',
  component: ErrorMessage,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Email is required.',
  },
}

export default meta
type Story = StoryObj<typeof ErrorMessage>

export const Default: Story = {}

export const LongCopy: Story = {
  args: {
    children:
      'Password must be at least 8 characters and contain at least one number, one letter, and one special character.',
  },
}

export const Empty: Story = {
  args: { children: undefined },
}
