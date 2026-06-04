import type { Meta, StoryObj } from '@storybook/react'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './Select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithDefaultValue: Story = {
  render: () => (
    <div className="w-64">
      <Select defaultValue="banana">
        <SelectTrigger>
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Grouped: Story = {
  render: () => (
    <div className="w-64">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Vegetables</SelectLabel>
            <SelectItem value="carrot">Carrot</SelectItem>
            <SelectItem value="potato">Potato</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const DisabledItem: Story = {
  render: () => (
    <div className="w-64">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Some unavailable" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Available A</SelectItem>
          <SelectItem value="b" disabled>
            Disabled B
          </SelectItem>
          <SelectItem value="c">Available C</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
