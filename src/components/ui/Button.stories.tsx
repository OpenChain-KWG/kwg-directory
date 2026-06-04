import type { Meta, StoryObj } from '@storybook/react'
import { Mail } from 'lucide-react'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    asChild: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Destructive: Story = { args: { variant: 'destructive' } }

export const Small: Story = { args: { size: 'sm' } }
export const Medium: Story = { args: { size: 'md' } }
export const Large: Story = { args: { size: 'lg' } }

export const Disabled: Story = { args: { disabled: true } }
export const Loading: Story = { args: { loading: true, children: 'Saving' } }

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail aria-hidden />
        Send email
      </>
    ),
  },
}

export const AsChildLink: Story = {
  args: {
    asChild: true,
    children: <a href="#">Link button</a>,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}
