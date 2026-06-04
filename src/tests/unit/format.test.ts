import { describe, it, expect } from 'vitest'

import { formatDate, formatNumber } from '@/lib/format'

describe('formatDate', () => {
  const iso = '2026-05-29T10:00:00.000Z'

  it('ko 로케일 단축 날짜', () => {
    // ko-KR 기본 단축형: "2026. 5. 29." 형태 (숫자 포함 확인)
    const out = formatDate(iso, 'ko')
    expect(out).toMatch(/2026/)
    expect(out).toMatch(/29/)
  })

  it('en 로케일은 ko와 다른 형식을 낸다', () => {
    const ko = formatDate(iso, 'ko')
    const en = formatDate(iso, 'en')
    expect(en).toMatch(/2026/)
    expect(en).not.toEqual(ko)
  })

  it('옵션 전달 — long month', () => {
    const out = formatDate(iso, 'en', { year: 'numeric', month: 'long', day: 'numeric' })
    expect(out).toMatch(/May/)
  })

  it('Date 객체도 처리', () => {
    expect(formatDate(new Date(iso), 'ko')).toMatch(/2026/)
  })

  it('잘못된/빈 입력 → 빈 문자열', () => {
    expect(formatDate(null, 'ko')).toBe('')
    expect(formatDate(undefined, 'ko')).toBe('')
    expect(formatDate('not-a-date', 'ko')).toBe('')
  })
})

describe('formatNumber', () => {
  it('천 단위 구분', () => {
    expect(formatNumber(1234567, 'en')).toBe('1,234,567')
  })

  it('ko 로케일도 천 단위 구분', () => {
    expect(formatNumber(12345, 'ko')).toBe('12,345')
  })

  it('옵션 전달 — 퍼센트', () => {
    expect(formatNumber(0.42, 'en', { style: 'percent' })).toBe('42%')
  })

  it('비유한값 → 빈 문자열', () => {
    expect(formatNumber(NaN, 'ko')).toBe('')
    expect(formatNumber(Infinity, 'ko')).toBe('')
  })
})
