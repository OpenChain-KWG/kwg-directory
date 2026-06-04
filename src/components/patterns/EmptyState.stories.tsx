import type { Meta, StoryObj } from '@storybook/react'
import { Inbox, Search } from 'lucide-react'

import { Button } from '../ui/Button'

import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Patterns/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    title: 'No items yet',
    description: 'When you create something, it will show up here.',
  },
}

export const WithIllustration: Story = {
  args: {
    illustration: <Inbox className="h-8 w-8" aria-hidden />,
    title: 'Inbox is empty',
    description: 'New messages will appear here when they arrive.',
  },
}

export const WithAction: Story = {
  args: {
    illustration: <Search className="h-8 w-8" aria-hidden />,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
    action: (
      <>
        <Button variant="outline">Clear filters</Button>
        <Button variant="primary">New search</Button>
      </>
    ),
  },
}

export const InCard: Story = {
  render: () => (
    <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <EmptyState
        illustration={<Inbox className="h-8 w-8" aria-hidden />}
        title="No drafts saved"
        description="Drafts you save will be available here."
        action={<Button size="sm">Create draft</Button>}
      />
    </div>
  ),
}
