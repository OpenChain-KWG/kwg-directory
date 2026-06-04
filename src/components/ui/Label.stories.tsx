import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Email' },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithInput: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const WithDisabledPeer: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Input id="d" disabled className="peer" />
      <Label htmlFor="d">Disabled field</Label>
    </div>
  ),
}
