import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from './Checkbox'
import { Label } from './Label'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {}

export const Checked: Story = { args: { defaultChecked: true } }

export const Disabled: Story = { args: { disabled: true } }

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
}

export const Indeterminate: Story = {
  args: { checked: 'indeterminate' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const Group: Story = {
  render: () => (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">Notification preferences</legend>
      <div className="flex items-center gap-2">
        <Checkbox id="email" defaultChecked />
        <Label htmlFor="email">Email</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="sms" />
        <Label htmlFor="sms">SMS</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="push" disabled />
        <Label htmlFor="push">Push (unavailable)</Label>
      </div>
    </fieldset>
  ),
}
