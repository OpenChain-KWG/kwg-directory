import type { Meta, StoryObj } from '@storybook/react'

import { Separator } from './Separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <p className="text-sm font-semibold">Section A</p>
      <Separator className="my-3" />
      <p className="text-sm text-[var(--color-text-muted)]">Section B</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Account</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Billing</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Team</span>
    </div>
  ),
}
