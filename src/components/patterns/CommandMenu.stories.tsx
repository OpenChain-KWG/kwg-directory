import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Calendar, Mail, Settings, Smile, User } from 'lucide-react'

import { Button } from '../ui/Button'

import {
  CommandMenu,
  CommandMenuEmpty,
  CommandMenuGroup,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  CommandMenuSeparator,
  CommandMenuShortcut,
} from './CommandMenu'

const meta: Meta<typeof CommandMenu> = {
  title: 'Patterns/CommandMenu',
  component: CommandMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof CommandMenu>

const MEMBERS = [
  { id: '1', name_ko: '김철수', company: 'OpenChain Korea' },
  { id: '2', name_ko: '이영희', company: 'KWG Foundation' },
  { id: '3', name_ko: '박민수', company: 'Acme Corp' },
  { id: '4', name_ko: '최서연', company: 'Globex' },
]

function ControlledExample({
  storyTitle,
  withGroups = true,
  withShortcuts = false,
}: {
  storyTitle: string
  withGroups?: boolean
  withShortcuts?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={() => setOpen(true)}>Open command menu</Button>
      <p className="text-xs text-[var(--color-text-muted)]">
        Or press <kbd>{'⌘'}</kbd>+<kbd>K</kbd>
      </p>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        dialogTitle={storyTitle}
        dialogDescription="Search across the directory and quick actions"
      >
        <CommandMenuInput placeholder="Type a command or search..." />
        <CommandMenuList>
          <CommandMenuEmpty>No results found.</CommandMenuEmpty>
          {withGroups ? (
            <>
              <CommandMenuGroup heading="Members">
                {MEMBERS.map((m) => (
                  <CommandMenuItem
                    key={m.id}
                    value={`${m.name_ko} ${m.company}`}
                    onSelect={() => setOpen(false)}
                  >
                    <User aria-hidden />
                    <span>{m.name_ko}</span>
                    <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                      {m.company}
                    </span>
                  </CommandMenuItem>
                ))}
              </CommandMenuGroup>
              <CommandMenuSeparator />
              <CommandMenuGroup heading="Suggestions">
                <CommandMenuItem>
                  <Calendar aria-hidden />
                  <span>Calendar</span>
                </CommandMenuItem>
                <CommandMenuItem>
                  <Smile aria-hidden />
                  <span>Search emoji</span>
                </CommandMenuItem>
              </CommandMenuGroup>
              <CommandMenuSeparator />
              <CommandMenuGroup heading="Settings">
                <CommandMenuItem>
                  <User aria-hidden />
                  <span>Profile</span>
                  {withShortcuts ? (
                    <CommandMenuShortcut>{'⌘P'}</CommandMenuShortcut>
                  ) : null}
                </CommandMenuItem>
                <CommandMenuItem>
                  <Mail aria-hidden />
                  <span>Mail</span>
                  {withShortcuts ? (
                    <CommandMenuShortcut>{'⌘M'}</CommandMenuShortcut>
                  ) : null}
                </CommandMenuItem>
                <CommandMenuItem>
                  <Settings aria-hidden />
                  <span>Settings</span>
                  {withShortcuts ? (
                    <CommandMenuShortcut>{'⌘,'}</CommandMenuShortcut>
                  ) : null}
                </CommandMenuItem>
              </CommandMenuGroup>
            </>
          ) : (
            <>
              <CommandMenuItem>Single ungrouped action</CommandMenuItem>
              <CommandMenuItem>Another action</CommandMenuItem>
            </>
          )}
        </CommandMenuList>
      </CommandMenu>
    </div>
  )
}

export const Default: Story = {
  render: () => <ControlledExample storyTitle="Command palette" />,
}

export const WithShortcuts: Story = {
  render: () => (
    <ControlledExample storyTitle="Command palette with shortcuts" withShortcuts />
  ),
}

export const Ungrouped: Story = {
  render: () => (
    <ControlledExample storyTitle="Ungrouped command palette" withGroups={false} />
  ),
}

function EmptyStateExample() {
  const [open, setOpen] = React.useState(true)
  return (
    <CommandMenu
      open={open}
      onOpenChange={setOpen}
      dialogTitle="Empty palette"
    >
      <CommandMenuInput placeholder="Search..." defaultValue="zzzzzz-no-match" />
      <CommandMenuList>
        <CommandMenuEmpty>
          No results matched the current query.
        </CommandMenuEmpty>
        <CommandMenuGroup heading="Members">
          <CommandMenuItem value="alice">Alice</CommandMenuItem>
        </CommandMenuGroup>
      </CommandMenuList>
    </CommandMenu>
  )
}

export const EmptyState: Story = {
  render: () => <EmptyStateExample />,
}
