import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from './Checkbox'
import { FormField } from './FormField'
import { Input } from './Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'
import { Textarea } from './Textarea'

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof FormField>

export const WithInput: Story = {
  render: () => (
    <FormField id="email">
      <FormField.Label>Email</FormField.Label>
      <FormField.Control>
        <Input type="email" placeholder="you@example.com" />
      </FormField.Control>
      <FormField.Helper>We never share your email.</FormField.Helper>
    </FormField>
  ),
}

export const WithError: Story = {
  render: () => (
    <FormField id="password" hasError>
      <FormField.Label>Password</FormField.Label>
      <FormField.Control>
        <Input type="password" />
      </FormField.Control>
      <FormField.Helper>At least 8 characters.</FormField.Helper>
      <FormField.Error>Password is too short.</FormField.Error>
    </FormField>
  ),
}

export const WithTextarea: Story = {
  render: () => (
    <FormField id="bio">
      <FormField.Label>Bio</FormField.Label>
      <FormField.Control>
        <Textarea rows={4} placeholder="Tell us about yourself" />
      </FormField.Control>
      <FormField.Helper>Optional. Markdown is not supported.</FormField.Helper>
    </FormField>
  ),
}

export const WithSelect: Story = {
  render: () => (
    <FormField id="role">
      <FormField.Label>Role</FormField.Label>
      <FormField.Control>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </FormField.Control>
    </FormField>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <FormField id="terms">
      <div className="flex items-center gap-2">
        <FormField.Control>
          <Checkbox />
        </FormField.Control>
        <FormField.Label>I agree to the terms.</FormField.Label>
      </div>
      <FormField.Helper>You must agree to continue.</FormField.Helper>
    </FormField>
  ),
}

export const Stack: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <FormField id="s-name">
        <FormField.Label>Name</FormField.Label>
        <FormField.Control>
          <Input placeholder="Jane Doe" />
        </FormField.Control>
      </FormField>
      <FormField id="s-email" hasError>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input type="email" defaultValue="not-an-email" />
        </FormField.Control>
        <FormField.Error>Enter a valid email address.</FormField.Error>
      </FormField>
      <FormField id="s-bio">
        <FormField.Label>Bio</FormField.Label>
        <FormField.Control>
          <Textarea rows={3} />
        </FormField.Control>
        <FormField.Helper>Up to 280 characters.</FormField.Helper>
      </FormField>
    </div>
  ),
}
