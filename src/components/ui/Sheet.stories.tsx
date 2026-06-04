import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './Sheet'

const meta: Meta<typeof Sheet> = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Sheet>

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open right sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Profile preview</SheetTitle>
          <SheetDescription>Member detail in a side sheet.</SheetDescription>
        </SheetHeader>
        <p className="text-sm text-[var(--color-text-muted)]">
          Side sheets are great for transient detail views on desktop.
        </p>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open left sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Mobile navigation drawer.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open bottom sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick actions</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-[var(--color-text-muted)]">
          Bottom sheets work well on mobile.
        </p>
      </SheetContent>
    </Sheet>
  ),
}
