import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { placeholder: 'Type something' },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, value: 'Disabled' } }
export const Error: Story = {
  args: { error: true, defaultValue: 'invalid@', 'aria-describedby': 'err-help' },
  render: (args) => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="email-input">Email</Label>
      <Input id="email-input" {...args} />
      <p id="err-help" className="text-xs text-[var(--color-state-danger)]">
        Please enter a valid email address.
      </p>
    </div>
  ),
}
export const WithLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="name-input">Name</Label>
      <Input id="name-input" placeholder="Your name" />
      <p className="text-xs text-[var(--color-text-muted)]">As shown on your profile.</p>
    </div>
  ),
}
export const Password: Story = { args: { type: 'password', placeholder: '••••••' } }
export const Search: Story = { args: { type: 'search', placeholder: 'Search…' } }
