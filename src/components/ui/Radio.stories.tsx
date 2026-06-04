import type { Meta, StoryObj } from '@storybook/react'

import { Label } from './Label'
import { RadioGroup, RadioGroupItem } from './Radio'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="apple">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-apple" value="apple" />
        <Label htmlFor="r-apple">Apple</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-banana" value="banana" />
        <Label htmlFor="r-banana">Banana</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="r-cherry" value="cherry" />
        <Label htmlFor="r-cherry">Cherry</Label>
      </div>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="da" value="a" />
        <Label htmlFor="da">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="db" value="b" />
        <Label htmlFor="db">Option B</Label>
      </div>
    </RadioGroup>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="m" className="flex-row gap-4">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="h-s" value="s" />
        <Label htmlFor="h-s">Small</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="h-m" value="m" />
        <Label htmlFor="h-m">Medium</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="h-l" value="l" />
        <Label htmlFor="h-l">Large</Label>
      </div>
    </RadioGroup>
  ),
}
