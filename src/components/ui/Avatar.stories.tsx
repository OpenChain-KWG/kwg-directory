import type { Meta, StoryObj } from '@storybook/react'

import { Avatar, AvatarFallback, AvatarImage } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://avatars.githubusercontent.com/u/9919?v=4"
        alt="GitHub avatar"
      />
      <AvatarFallback>HJ</AvatarFallback>
    </Avatar>
  ),
}

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>KW</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar className="h-6 w-6 text-xs">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14 text-base">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20 text-lg">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
}
