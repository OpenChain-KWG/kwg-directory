import { describe, it, expect } from 'vitest'

import { sortMembers } from '@/components/directory/sort'
import type { Member } from '@/types/member'

function makeMember(partial: Partial<Member> & { id: string; name_ko: string; created_at: string }): Member {
  return {
    user_id: `u-${partial.id}`,
    name_en: undefined,
    company: 'Acme',
    role: undefined,
    bio: undefined,
    category: '기업',
    email: undefined,
    email_public: false,
    phone: undefined,
    phone_public: false,
    linkedin: undefined,
    github: undefined,
    discord: undefined,
    blog: undefined,
    avatar_url: undefined,
    tags: [],
    approved: true,
    updated_at: partial.created_at,
    ...partial,
  }
}

const members: Member[] = [
  makeMember({ id: '1', name_ko: '나길동', created_at: '2024-03-01T00:00:00Z' }),
  makeMember({ id: '2', name_ko: '가나다', created_at: '2024-01-01T00:00:00Z' }),
  makeMember({ id: '3', name_ko: '다람쥐', created_at: '2024-05-01T00:00:00Z' }),
]

describe('sortMembers', () => {
  it('이름순(name)은 한국어 로케일 기준으로 오름차순 정렬한다', () => {
    const sorted = sortMembers(members, 'name')
    // 가나다(2) < 나길동(1) < 다람쥐(3)
    expect(sorted.map((m) => m.id)).toEqual(['2', '1', '3'])
  })

  it('가입순(joined)은 created_at 내림차순 정렬한다', () => {
    const sorted = sortMembers(members, 'joined')
    expect(sorted.map((m) => m.id)).toEqual(['3', '1', '2'])
  })

  it('랜덤(random)은 입력을 변경하지 않고 길이가 동일한 새 배열을 반환한다', () => {
    const original = members.slice()
    const sorted = sortMembers(members, 'random', 42)
    expect(sorted).toHaveLength(members.length)
    expect(members).toEqual(original)
    expect(new Set(sorted.map((m) => m.id))).toEqual(new Set(['1', '2', '3']))
  })

  it('동일한 seed는 동일한 랜덤 순서를 보장한다', () => {
    const a = sortMembers(members, 'random', 7)
    const b = sortMembers(members, 'random', 7)
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id))
  })
})
