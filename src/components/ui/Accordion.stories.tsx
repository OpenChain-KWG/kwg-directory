import type { Meta, StoryObj } from '@storybook/react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion'

const meta: Meta<typeof Accordion> = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Accordion>

const items = [
  {
    value: 'item-1',
    title: 'Is it accessible?',
    body: 'Yes. It adheres to the WAI-ARIA design pattern for accordions.',
  },
  {
    value: 'item-2',
    title: 'Is it styled?',
    body: 'Yes — colors, spacing and motion all derive from design tokens.',
  },
  {
    value: 'item-3',
    title: 'Is it animated?',
    body: 'Yes. Animation is automatically disabled when `prefers-reduced-motion` is set.',
  },
]

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[28rem] max-w-full">
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
}

export const Multiple: Story = {
  render: () => (
    <Accordion
      type="multiple"
      defaultValue={['item-1', 'item-3']}
      className="w-[28rem] max-w-full"
    >
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
}

export const WithDisabledItem: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[28rem] max-w-full">
      <AccordionItem value="a">
        <AccordionTrigger>Active item</AccordionTrigger>
        <AccordionContent>Open me freely.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b" disabled>
        <AccordionTrigger>Disabled item</AccordionTrigger>
        <AccordionContent>You should not see this.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Another item</AccordionTrigger>
        <AccordionContent>This one works too.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
