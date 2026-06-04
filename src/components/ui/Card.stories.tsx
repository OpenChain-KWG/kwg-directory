import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Project status</CardTitle>
        <CardDescription>Updated a moment ago.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--color-text-muted)]">
          12 of 18 tasks complete.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" size="sm">
          View
        </Button>
        <Button size="sm">Update</Button>
      </CardFooter>
    </Card>
  ),
}

export const Minimal: Story = {
  render: () => (
    <Card className="w-72 p-6">
      <p className="text-sm text-[var(--color-text-default)]">
        Cards can host any layout — header/content/footer are optional.
      </p>
    </Card>
  ),
}
