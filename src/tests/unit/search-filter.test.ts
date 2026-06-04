import { describe, it, expect } from 'vitest'
import { escapePostgrestFilterValue, buildIlikeOrFilter } from '@/lib/search-filter'

describe('escapePostgrestFilterValue', () => {
  it('백슬래시를 이스케이프', () => {
    expect(escapePostgrestFilterValue('a\\b')).toBe('a\\\\b')
  })

  it('큰따옴표를 이스케이프', () => {
    expect(escapePostgrestFilterValue('a"b')).toBe('a\\"b')
  })

  it('일반 문자는 그대로 둔다 (콤마·점 포함)', () => {
    expect(escapePostgrestFilterValue('삼성, LG.co')).toBe('삼성, LG.co')
  })
})

describe('buildIlikeOrFilter', () => {
  it('각 컬럼을 큰따옴표로 감싼 ilike 값으로 조립', () => {
    expect(buildIlikeOrFilter(['name_ko', 'company'], '홍길동')).toBe(
      'name_ko.ilike."%홍길동%",company.ilike."%홍길동%"'
    )
  })

  it('콤마 포함 검색어가 logic tree로 새지 않고 값 안에 갇힌다 (500 방지)', () => {
    expect(buildIlikeOrFilter(['name_ko'], '삼성, LG')).toBe('name_ko.ilike."%삼성, LG%"')
  })

  it('필터 주입 시도가 별도 OR 조건이 아닌 리터럴 값으로 갇힌다 (BUG-003)', () => {
    // q에 email.ilike 필터를 주입해 비공개 컬럼 enumeration을 시도하는 페이로드
    const payload = 'a,email.ilike.b'
    expect(buildIlikeOrFilter(['name_ko', 'name_en', 'company'], payload)).toBe(
      'name_ko.ilike."%a,email.ilike.b%",name_en.ilike."%a,email.ilike.b%",company.ilike."%a,email.ilike.b%"'
    )
  })

  it('따옴표 주입 시도도 이스케이프된다', () => {
    expect(buildIlikeOrFilter(['name_ko'], 'x"y')).toBe('name_ko.ilike."%x\\"y%"')
  })
})
