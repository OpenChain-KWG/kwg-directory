import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Banner } from './Banner'

const meta: Meta<typeof Banner> = {
  title: 'UI/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    'aria-label': 'Site notification',
    children: 'Scheduled maintenance window starts at 22:00 UTC.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'warning', 'announcement'],
    },
    sticky: { control: 'boolean' },
    dismissible: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Banner>

export const Default: Story = {}

export const Info: Story = { args: { variant: 'info' } }
export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Your free plan expires in 3 days.',
  },
}
export const Announcement: Story = {
  args: {
    variant: 'announcement',
    children: 'New: Customizable workspace themes are now live.',
  },
}

export const WithAction: Story = {
  args: {
    variant: 'announcement',
    children: 'Try the new analytics dashboard.',
    action: (
      <a
        href="#"
        className="font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] rounded-sm"
      >
        Learn more
      </a>
    ),
  },
}

export const Dismissible: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Storybook render fn is an implicit component
    const [open, setOpen] = useState(true)
    if (!open)
      return (
        <p className="text-sm text-[var(--color-text-muted)]">Banner dismissed.</p>
      )
    return <Banner {...args} dismissible onDismiss={() => setOpen(false)} />
  },
}

export const Sticky: Story = {
  args: { sticky: true, variant: 'warning' },
  render: (args) => (
    <div className="h-72 overflow-y-auto">
      <Banner {...args} />
      <div className="space-y-2 p-4 text-sm text-[var(--color-text-muted)]">
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>Scroll content row {i + 1}</p>
        ))}
      </div>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Banner aria-label="Info" variant="info">
        Information banner content.
      </Banner>
      <Banner aria-label="Warning" variant="warning">
        Warning banner content.
      </Banner>
      <Banner aria-label="Announcement" variant="announcement">
        Announcement banner content.
      </Banner>
    </div>
  ),
}
