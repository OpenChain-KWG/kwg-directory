import type { Meta, StoryObj } from '@storybook/react'

import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <Slider defaultValue={[40]} aria-label="Volume" />
    </div>
  ),
}

export const Range: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <Slider defaultValue={[20, 80]} aria-label="Price range" />
    </div>
  ),
}

export const WithStep: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <Slider defaultValue={[50]} step={10} aria-label="Quality" />
    </div>
  ),
}

export const WithMarks: Story = {
  render: () => (
    <div className="w-80 max-w-full pb-8">
      <Slider
        defaultValue={[50]}
        step={25}
        marks={[
          { value: 0, label: '0' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
          { value: 75, label: '75' },
          { value: 100, label: '100' },
        ]}
        aria-label="Score"
      />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-80 max-w-full">
      <Slider defaultValue={[60]} disabled aria-label="Disabled slider" />
    </div>
  ),
}
