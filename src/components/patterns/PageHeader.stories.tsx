import type { Meta, StoryObj } from '@storybook/react'
import { Plus, Settings } from 'lucide-react'

import { Button } from '../ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'

import { PageHeader } from './PageHeader'

const meta: Meta<typeof PageHeader> = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    title: 'Members',
    description: 'Browse and manage workgroup members.',
  },
}

export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbs: [
      { label: 'Home', href: '#' },
      { label: 'Admin', href: '#' },
      { label: 'Members' },
    ],
    title: 'Members',
    description: 'Browse and manage workgroup members.',
  },
}

export const WithActions: Story = {
  args: {
    title: 'Members',
    description: 'Browse and manage workgroup members.',
    actions: (
      <>
        <Button variant="outline" size="sm">
          <Settings aria-hidden />
          Settings
        </Button>
        <Button size="sm">
          <Plus aria-hidden />
          New member
        </Button>
      </>
    ),
  },
}

export const WithTabs: Story = {
  render: () => (
    <PageHeader
      breadcrumbs={[{ label: 'Home', href: '#' }, { label: 'Members' }]}
      title="Members"
      description="Browse and manage workgroup members."
      actions={<Button size="sm">New member</Button>}
      tabs={
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <TabsContent value="all" />
        </Tabs>
      }
    />
  ),
}

export const TitleOnly: Story = {
  args: { title: 'Settings' },
}
