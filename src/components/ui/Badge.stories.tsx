import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { children: 'Badge' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'outline',
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Success: Story = { args: { variant: 'success', children: 'Approved' } }
export const Warning: Story = { args: { variant: 'warning', children: 'Pending' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Rejected' } }
export const Info: Story = { args: { variant: 'info', children: 'New' } }
export const Outline: Story = { args: { variant: 'outline' } }

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}
