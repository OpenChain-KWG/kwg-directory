import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'
import { Input } from './Input'
import { Label } from './Label'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Dimensions</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Set the width and height for the layer.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pop-name">Name</Label>
            <Input id="pop-name" defaultValue="Jane Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pop-email">Email</Label>
            <Input id="pop-email" type="email" defaultValue="jane@example.com" />
          </div>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  ),
}

export const Aligned: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Start
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">align=start</PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Center
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center">align=center</PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            End
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">align=end</PopoverContent>
      </Popover>
    </div>
  ),
}
