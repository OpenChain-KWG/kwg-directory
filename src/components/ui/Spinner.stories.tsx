import type { Meta, StoryObj } from '@storybook/react'

import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {}
export const Small: Story = { args: { size: 'sm' } }
export const Medium: Story = { args: { size: 'md' } }
export const Large: Story = { args: { size: 'lg' } }
export const Custom: Story = {
  args: { size: 'lg', className: 'text-[var(--color-state-primary)]' },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-[var(--color-state-primary)]">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
}
