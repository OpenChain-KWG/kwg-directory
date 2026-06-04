import { describe, it, expect } from 'vitest'
import { getInitials, formatMemberCategory, filterMembers } from '@/lib/utils'
import { Member } from '@/types/member'

const members: Member[] = [
  {
    id: '1',
    user_id: 'u1',
    name_ko: '홍길동',
    company: 'SK텔레콤',
    category: '기업',
    email_public: false,
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'u2',
    name_ko: '김소스',
    name_en: 'Source Kim',
    company: 'ETRI',
    category: '연구/공공',
    email_public: false,
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'u3',
    name_ko: '이홍길',
    company: 'OSSLab',
    category: '학계',
    email_public: false,
    approved: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('getInitials', () => {
  it('한글 이름에서 첫 글자를 반환한다', () => {
    expect(getInitials('홍길동')).toBe('홍')
  })

  it('영문 단어 하나면 첫 글자 대문자를 반환한다', () => {
    expect(getInitials('A')).toBe('A')
  })

  it('영문 이름에서 이니셜(최대 2자)을 반환한다', () => {
    expect(getInitials('Gildong Hong')).toBe('GH')
  })

  it('빈 문자열이면 "?"를 반환한다', () => {
    expect(getInitials('')).toBe('?')
  })
})

describe('formatMemberCategory', () => {
  it('카테고리 문자열을 그대로 반환한다', () => {
    expect(formatMemberCategory('기업')).toBe('기업')
    expect(formatMemberCategory('학계')).toBe('학계')
    expect(formatMemberCategory('연구/공공')).toBe('연구/공공')
  })
})

describe('filterMembers', () => {
  it('이름 쿼리로 검색하면 해당 멤버만 반환된다', () => {
    const result = filterMembers(members, '홍', 'all')
    expect(result).toHaveLength(2) // '홍길동', '이홍길'
    expect(result.map((m) => m.id)).toContain('1')
    expect(result.map((m) => m.id)).toContain('3')
  })

  it('빈 쿼리 + 카테고리 필터 시 해당 카테고리 멤버만 반환된다', () => {
    const result = filterMembers(members, '', '기업')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('쿼리와 카테고리 모두 적용 시 두 조건을 모두 만족하는 멤버만 반환된다', () => {
    const result = filterMembers(members, '홍', '기업')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1') // 홍길동 + 기업
  })

  it('빈 쿼리와 "all" 카테고리면 전체 멤버를 반환한다', () => {
    const result = filterMembers(members, '', 'all')
    expect(result).toHaveLength(3)
  })

  it('"전체" 카테고리는 모든 카테고리를 포함한다', () => {
    const result = filterMembers(members, '', '전체')
    expect(result).toHaveLength(3)
  })

  it('일치하는 멤버가 없으면 빈 배열을 반환한다', () => {
    const result = filterMembers(members, '존재하지않는이름', 'all')
    expect(result).toHaveLength(0)
  })
})
