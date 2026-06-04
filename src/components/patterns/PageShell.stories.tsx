import type { Meta, StoryObj } from '@storybook/react'
import { Bell, Search, User } from 'lucide-react'

import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { Input } from '../ui/Input'

import { PageShell } from './PageShell'

const meta: Meta<typeof PageShell> = {
  title: 'Patterns/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof PageShell>

const sidebarContent = (
  <nav className="flex flex-col gap-1 text-sm">
    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
      Workspace
    </p>
    {['Overview', 'Members', 'Activity', 'Settings'].map((label) => (
      <a
        key={label}
        href="#"
        className="rounded-sm px-2 py-1.5 text-[var(--color-text-default)] transition-colors hover:bg-[var(--color-bg-surface-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      >
        {label}
      </a>
    ))}
  </nav>
)

const topbarContent = (
  <>
    <div className="relative w-full max-w-sm">
      <Search
        aria-hidden
        className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <Input className="pl-8" placeholder="Search" aria-label="Search" />
    </div>
    <div className="ml-auto flex items-center gap-2">
      <IconButton aria-label="Notifications" variant="ghost">
        <Bell aria-hidden />
      </IconButton>
      <IconButton aria-label="Account" variant="ghost">
        <User aria-hidden />
      </IconButton>
    </div>
  </>
)

const mainContent = (
  <div className="flex flex-col gap-4">
    <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
    <p className="text-sm text-[var(--color-text-muted)]">
      The PageShell renders sidebar, topbar and main slots. On mobile, the
      sidebar collapses behind a sheet toggled from the topbar.
    </p>
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-32 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-alt)]"
        />
      ))}
    </div>
    <Button className="self-start">Primary action</Button>
  </div>
)

export const Default: Story = {
  render: () => (
    <PageShell sidebar={sidebarContent} topbar={topbarContent}>
      {mainContent}
    </PageShell>
  ),
}

export const NoTopbar: Story = {
  render: () => <PageShell sidebar={sidebarContent}>{mainContent}</PageShell>,
}

export const WideSidebar: Story = {
  render: () => (
    <PageShell
      sidebar={sidebarContent}
      topbar={topbarContent}
      sidebarWidthClass="w-72"
    >
      {mainContent}
    </PageShell>
  ),
}
