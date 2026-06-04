import type { Meta, StoryObj } from '@storybook/react'

import { Label } from './Label'
import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Tell us about yourself…', rows: 4 },
  argTypes: {
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
    autoResize: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, value: 'Read only' } }
export const Error: Story = { args: { error: true, defaultValue: 'Too short' } }
export const AutoResize: Story = {
  args: { autoResize: true, defaultValue: 'Try typing\nmultiple\nlines' },
}
export const WithLabel: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Short bio" />
      <p className="text-xs text-[var(--color-text-muted)]">Max 280 characters.</p>
    </div>
  ),
}
