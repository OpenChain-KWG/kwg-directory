import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isEnabled, flags } from '@/lib/feature-flags'

describe('feature-flags', () => {
  const original = { ...process.env }

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM
    delete process.env.NEXT_PUBLIC_FF_COMMAND_MENU
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('returns false when env var is unset', () => {
    expect(isEnabled('newProfileForm')).toBe(false)
  })

  it('returns true when env var is "on"', () => {
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = 'on'
    expect(isEnabled('newProfileForm')).toBe(true)
  })

  it('returns true for "true" and "1"', () => {
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = 'true'
    expect(isEnabled('newProfileForm')).toBe(true)
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = '1'
    expect(isEnabled('newProfileForm')).toBe(true)
  })

  it('returns false for "off" or empty', () => {
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = 'off'
    expect(isEnabled('newProfileForm')).toBe(false)
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = ''
    expect(isEnabled('newProfileForm')).toBe(false)
  })

  it('flags() returns multiple as object', () => {
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = 'on'
    process.env.NEXT_PUBLIC_FF_COMMAND_MENU = 'off'
    expect(flags('newProfileForm', 'commandMenu')).toEqual({
      newProfileForm: true,
      commandMenu: false,
    })
  })

  it('camelCase flag name maps to SCREAMING_SNAKE env var', () => {
    process.env.NEXT_PUBLIC_FF_NEW_PROFILE_FORM = 'on'
    expect(isEnabled('newProfileForm')).toBe(true)
  })
})
