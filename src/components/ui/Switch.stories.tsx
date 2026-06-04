import type { Meta, StoryObj } from '@storybook/react'

import { Label } from './Label'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {}

export const Checked: Story = { args: { defaultChecked: true } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane" />
      <Label htmlFor="airplane">Airplane mode</Label>
    </div>
  ),
}
