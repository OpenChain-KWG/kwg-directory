import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { ThemeToggle } from '@/components/ThemeToggle'
import { T } from '../../../e2e/helpers/testIds'
import koMessages from '../../../messages/ko.json'

function renderToggle() {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('data-theme')
})

describe('ThemeToggle', () => {
  it('클릭 시 data-theme을 light↔dark로 토글한다', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    renderToggle()
    const btn = screen.getByTestId(T.themeToggle)

    fireEvent.click(btn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    fireEvent.click(btn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('접근 가능한 이름을 노출한다', () => {
    renderToggle()
    expect(screen.getByTestId(T.themeToggle)).toHaveAccessibleName()
  })
})
