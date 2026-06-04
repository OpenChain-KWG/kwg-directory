import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    title: 'Heads up',
    description: 'You can update your preferences in settings.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
    },
    dismissible: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {}

export const Info: Story = { args: { variant: 'info' } }
export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Saved',
    description: 'Your changes have been saved successfully.',
  },
}
export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Heads up',
    description: 'Your session will expire in 5 minutes.',
  },
}
export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Something went wrong',
    description: 'Unable to load the page. Please try again.',
  },
}

export const Dismissible: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Storybook render fn is an implicit component
    const [open, setOpen] = useState(true)
    if (!open) return <p className="text-sm text-[var(--color-text-muted)]">Alert dismissed.</p>
    return <Alert {...args} dismissible onDismiss={() => setOpen(false)} />
  },
}

export const TitleOnly: Story = {
  args: { title: 'Network restored', description: undefined, variant: 'success' },
}

export const ComposedSlots: Story = {
  render: () => (
    <Alert variant="info" icon={null}>
      <AlertTitle>Compose with slot helpers</AlertTitle>
      <AlertDescription>
        You may pass children directly when you need richer content.
      </AlertDescription>
    </Alert>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert variant="info" title="Info" description="Informational message." />
      <Alert variant="success" title="Success" description="Operation succeeded." />
      <Alert variant="warning" title="Warning" description="Review before continuing." />
      <Alert variant="danger" title="Error" description="Something went wrong." />
    </div>
  ),
}
