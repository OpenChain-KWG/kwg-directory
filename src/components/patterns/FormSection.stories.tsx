import type { Meta, StoryObj } from '@storybook/react'

import { FormField } from '../ui/FormField'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

import { FormSection } from './FormSection'

const meta: Meta<typeof FormSection> = {
  title: 'Patterns/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    columns: { control: 'inline-radio', options: [1, 2] },
  },
}

export default meta
type Story = StoryObj<typeof FormSection>

export const SingleColumn: Story = {
  render: () => (
    <FormSection
      title="Profile"
      description="Public information shown on your member card."
      className="max-w-xl"
    >
      <FormField>
        <FormField.Label>Display name</FormField.Label>
        <FormField.Control>
          <Input placeholder="Pat Doe" />
        </FormField.Control>
        <FormField.Helper>Visible on your card.</FormField.Helper>
      </FormField>
      <FormField>
        <FormField.Label>Bio</FormField.Label>
        <FormField.Control>
          <Textarea rows={3} placeholder="Tell others what you work on" />
        </FormField.Control>
      </FormField>
    </FormSection>
  ),
}

export const TwoColumns: Story = {
  render: () => (
    <FormSection
      title="Contact"
      description="How members can reach you. Optional fields are kept private by default."
      helperText="Toggle individual fields to make them public on your profile."
      columns={2}
      className="max-w-3xl"
    >
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input type="email" placeholder="you@example.com" />
        </FormField.Control>
      </FormField>
      <FormField>
        <FormField.Label>Phone</FormField.Label>
        <FormField.Control>
          <Input type="tel" placeholder="+82 10-0000-0000" />
        </FormField.Control>
      </FormField>
      <FormField>
        <FormField.Label>LinkedIn</FormField.Label>
        <FormField.Control>
          <Input placeholder="linkedin.com/in/handle" />
        </FormField.Control>
      </FormField>
      <FormField>
        <FormField.Label>GitHub</FormField.Label>
        <FormField.Control>
          <Input placeholder="github.com/handle" />
        </FormField.Control>
      </FormField>
    </FormSection>
  ),
}

export const WithHelperOnly: Story = {
  render: () => (
    <FormSection
      title="Notifications"
      helperText="Choose how often we send digest emails."
      className="max-w-xl"
    >
      <FormField>
        <FormField.Label>Frequency</FormField.Label>
        <FormField.Control>
          <Input placeholder="Weekly" />
        </FormField.Control>
      </FormField>
    </FormSection>
  ),
}
