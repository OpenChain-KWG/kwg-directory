import { describe, it, expect } from 'vitest'
import {
  MemberCreateSchema,
  MemberUpdateSchema,
  AdminIdSchema,
  AdminRejectSchema,
  AdminMembersSchema,
  AdminAdminsSchema,
} from '@/lib/schemas'

const validMemberCreate = {
  name_ko: '홍길동',
  company: '테스트 회사',
  contact_email: 'test@example.com',
  subscribe_mailing_list: true,
  privacy_agreed_at: new Date().toISOString(),
}

describe('MemberCreateSchema', () => {
  it('필수 필드만으로 통과', () => {
    expect(MemberCreateSchema.safeParse(validMemberCreate).success).toBe(true)
  })

  it('name_ko 빈 문자열 → 실패', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, name_ko: '' })
    expect(result.success).toBe(false)
  })

  it('company 빈 문자열 → 실패', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, company: '' })
    expect(result.success).toBe(false)
  })

  it('contact_email 형식 오류 → 실패', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, contact_email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('tags 11개 → 실패', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`)
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, tags })
    expect(result.success).toBe(false)
  })

  it('tags 10개 → 통과', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`)
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, tags })
    expect(result.success).toBe(true)
  })

  it('category 유효값 → 통과', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, category: '기업' })
    expect(result.success).toBe(true)
  })

  it('category 잘못된 값 → 실패', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, category: '기타' })
    expect(result.success).toBe(false)
  })

  it('category 빈 문자열 → 통과 + undefined로 정규화 (BUG-001)', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, category: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.category).toBeUndefined()
  })

  it('bio 200자 초과 → 실패', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, bio: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('email 빈 문자열 → 통과 (미입력 허용)', () => {
    const result = MemberCreateSchema.safeParse({ ...validMemberCreate, email: '' })
    expect(result.success).toBe(true)
  })
})

describe('MemberUpdateSchema', () => {
  it('필수 필드만으로 통과', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사' })
    expect(result.success).toBe(true)
  })

  it('name_ko 50자 초과 → 실패', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: 'a'.repeat(51), company: '회사' })
    expect(result.success).toBe(false)
  })

  it('email 빈 문자열 → 통과 (미입력 허용)', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사', email: '' })
    expect(result.success).toBe(true)
  })

  it('email 잘못된 형식 → 실패', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('contact_email 빈 문자열 → 통과 (미입력 허용)', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사', contact_email: '' })
    expect(result.success).toBe(true)
  })

  it('contact_email 잘못된 형식 → 실패', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사', contact_email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('category 빈 문자열 → 통과 + undefined로 정규화 (BUG-001)', () => {
    const result = MemberUpdateSchema.safeParse({ name_ko: '홍길동', company: '회사', category: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.category).toBeUndefined()
  })
})

describe('AdminIdSchema', () => {
  it('유효한 UUID → 통과', () => {
    expect(AdminIdSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' }).success).toBe(true)
  })

  it('UUID 형식 오류 → 실패', () => {
    expect(AdminIdSchema.safeParse({ id: 'not-uuid' }).success).toBe(false)
  })

  it('id 누락 → 실패', () => {
    expect(AdminIdSchema.safeParse({}).success).toBe(false)
  })
})

describe('AdminRejectSchema', () => {
  it('유효한 입력 → 통과', () => {
    const result = AdminRejectSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      reason: '기준 미충족',
    })
    expect(result.success).toBe(true)
  })

  it('reason 빈 문자열 → 실패', () => {
    const result = AdminRejectSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      reason: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('AdminMembersSchema', () => {
  it('유효한 승인 요청 → 통과', () => {
    const result = AdminMembersSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      approved: true,
    })
    expect(result.success).toBe(true)
  })

  it('approved가 boolean이 아님 → 실패', () => {
    const result = AdminMembersSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      approved: 'yes',
    })
    expect(result.success).toBe(false)
  })
})

describe('AdminAdminsSchema', () => {
  it('add 액션 → 통과', () => {
    const result = AdminAdminsSchema.safeParse({
      action: 'add',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('remove 액션 → 통과', () => {
    const result = AdminAdminsSchema.safeParse({
      action: 'remove',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 action → 실패', () => {
    const result = AdminAdminsSchema.safeParse({
      action: 'delete',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(false)
  })
})
