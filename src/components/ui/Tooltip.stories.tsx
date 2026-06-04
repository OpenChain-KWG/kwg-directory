import type { Meta, StoryObj } from '@storybook/react'

import { Button } from './Button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={150}>
        <Story />
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Helpful hint</TooltipContent>
    </Tooltip>
  ),
}

export const Positions: Story = {
  render: () => (
    <div className="flex gap-3">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="secondary">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Side: {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}
