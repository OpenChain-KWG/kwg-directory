import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'
import { toast, Toaster } from './Toast'

const meta: Meta<typeof Toaster> = {
  title: 'UI/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={() => toast('Saved successfully')}>Show toast</Button>
      <Toaster />
    </div>
  ),
}

export const Success: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant="primary"
        onClick={() => toast.success('Profile updated', { description: 'Changes are live.' })}
      >
        Success toast
      </Button>
      <Toaster />
    </div>
  ),
}

export const Error: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant="destructive"
        onClick={() =>
          toast.error('Failed to save', {
            description: 'Try again in a moment.',
          })
        }
      >
        Error toast
      </Button>
      <Toaster />
    </div>
  ),
}

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button
        onClick={() =>
          toast('Item moved to trash', {
            action: {
              label: 'Undo',
              onClick: () => toast.success('Restored'),
            },
          })
        }
      >
        Toast with action
      </Button>
      <Toaster />
    </div>
  ),
}

export const PromiseToast: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Button
        onClick={() => {
          const job = new Promise<void>((resolve) =>
            setTimeout(() => resolve(), 1500),
          )
          toast.promise(job, {
            loading: 'Saving...',
            success: 'Saved',
            error: 'Failed',
          })
        }}
      >
        Promise toast
      </Button>
      <Toaster />
    </div>
  ),
}
