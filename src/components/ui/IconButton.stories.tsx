import type { Meta, StoryObj } from '@storybook/react'
import { Bell, Heart, Plus, Settings, Trash2 } from 'lucide-react'

import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    'aria-label': 'Settings',
    children: <Settings aria-hidden />,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: { control: 'select', options: ['icon-sm', 'icon-md', 'icon-lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {}

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Destructive: Story = {
  args: { variant: 'destructive', children: <Trash2 aria-hidden />, 'aria-label': 'Delete' },
}

export const SizeSmall: Story = { args: { size: 'icon-sm' } }
export const SizeMedium: Story = { args: { size: 'icon-md' } }
export const SizeLarge: Story = { args: { size: 'icon-lg' } }

export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Like" size="icon-sm">
        <Heart aria-hidden />
      </IconButton>
      <IconButton aria-label="Like" size="icon-md">
        <Heart aria-hidden />
      </IconButton>
      <IconButton aria-label="Like" size="icon-lg">
        <Heart aria-hidden />
      </IconButton>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton variant="primary" aria-label="Add">
        <Plus aria-hidden />
      </IconButton>
      <IconButton variant="secondary" aria-label="Notifications">
        <Bell aria-hidden />
      </IconButton>
      <IconButton variant="outline" aria-label="Settings">
        <Settings aria-hidden />
      </IconButton>
      <IconButton variant="ghost" aria-label="Like">
        <Heart aria-hidden />
      </IconButton>
      <IconButton variant="destructive" aria-label="Delete">
        <Trash2 aria-hidden />
      </IconButton>
    </div>
  ),
}
