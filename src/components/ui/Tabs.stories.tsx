import type { Meta, StoryObj } from '@storybook/react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-[var(--color-text-muted)]">
          Summary panel with key metrics.
        </p>
      </TabsContent>
      <TabsContent value="activity">
        <p className="text-sm text-[var(--color-text-muted)]">
          Recent activity feed.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm text-[var(--color-text-muted)]">
          Configuration controls.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="a" className="w-96">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b" disabled>
          B (disabled)
        </TabsTrigger>
        <TabsTrigger value="c">C</TabsTrigger>
      </TabsList>
      <TabsContent value="a">A content</TabsContent>
      <TabsContent value="c">C content</TabsContent>
    </Tabs>
  ),
}
