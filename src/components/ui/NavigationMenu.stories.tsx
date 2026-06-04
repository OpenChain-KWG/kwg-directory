import type { Meta, StoryObj } from '@storybook/react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './NavigationMenu'

const meta: Meta<typeof NavigationMenu> = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof NavigationMenu>

const products = [
  { title: 'Analytics', description: 'Track product usage in real time.' },
  { title: 'Engagement', description: 'Reach users with targeted updates.' },
  { title: 'Security', description: 'Audit logs and access control.' },
  { title: 'Integrations', description: 'Connect to your existing stack.' },
]

const resources = [
  { title: 'Documentation', description: 'Guides and references.' },
  { title: 'Changelog', description: 'Latest releases.' },
  { title: 'Status', description: 'Service availability.' },
]

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[28rem] grid-cols-2 gap-2 p-3">
              {products.map((p) => (
                <li key={p.title}>
                  <NavigationMenuLink href="#">
                    <span className="font-medium leading-tight">{p.title}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {p.description}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[18rem] gap-2 p-3">
              {resources.map((r) => (
                <li key={r.title}>
                  <NavigationMenuLink href="#">
                    <span className="font-medium leading-tight">{r.title}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {r.description}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

export const SingleSection: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Help</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[20rem] gap-1 p-2">
              <li>
                <NavigationMenuLink href="#">Getting started</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">FAQ</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">Contact support</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}
