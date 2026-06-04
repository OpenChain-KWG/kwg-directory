import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextMenu'

const meta: Meta<typeof ContextMenu> = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof ContextMenu>

const TriggerSurface = () => (
  <div
    className="flex h-44 w-72 select-none items-center justify-center rounded-md border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-sm text-[var(--color-text-muted)]"
  >
    Right-click here
  </div>
)

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerSurface />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          Back
          <ContextMenuShortcut>Alt+Left</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Forward
          <ContextMenuShortcut>Alt+Right</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Reload
          <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>View source</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}

export const WithSubmenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TriggerSurface />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Copy link</ContextMenuItem>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Slack</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}

export const WithCheckboxAndRadio: Story = {
  render: () => {
    /* eslint-disable react-hooks/rules-of-hooks -- Storybook render fn is an implicit component */
    const [showBookmarks, setShowBookmarks] = useState(true)
    const [showStatus, setShowStatus] = useState(false)
    const [position, setPosition] = useState('top')
    /* eslint-enable react-hooks/rules-of-hooks */

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TriggerSurface />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Toolbars</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={showBookmarks}
            onCheckedChange={setShowBookmarks}
          >
            Show bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={showStatus}
            onCheckedChange={setShowStatus}
          >
            Show status bar
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Position</ContextMenuLabel>
          <ContextMenuRadioGroup value={position} onValueChange={setPosition}>
            <ContextMenuRadioItem value="top">Top</ContextMenuRadioItem>
            <ContextMenuRadioItem value="bottom">Bottom</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
}
