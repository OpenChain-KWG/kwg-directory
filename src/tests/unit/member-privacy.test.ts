import { describe, it, expect } from 'vitest'
import { redactMemberContact } from '@/lib/member-privacy'

describe('redactMemberContact — email', () => {
  it('인증 + email_public=false → email null', () => {
    const result = redactMemberContact(
      { email: 'a@b.com', email_public: false },
      true
    )
    expect(result.email).toBeNull()
  })

  it('인증 + email_public=true → email 그대로', () => {
    const result = redactMemberContact(
      { email: 'a@b.com', email_public: true },
      true
    )
    expect(result.email).toBe('a@b.com')
  })

  it('비인증 + email_public=true → email null', () => {
    const result = redactMemberContact(
      { email: 'a@b.com', email_public: true },
      false
    )
    expect(result.email).toBeNull()
  })

  it('비인증 + email_public=false → email null', () => {
    const result = redactMemberContact(
      { email: 'a@b.com', email_public: false },
      false
    )
    expect(result.email).toBeNull()
  })
})

describe('redactMemberContact — phone', () => {
  it('인증 + phone_public=false → phone null', () => {
    const result = redactMemberContact(
      { email: null, email_public: false, phone: '010-1234-5678', phone_public: false },
      true
    )
    expect(result.phone).toBeNull()
  })

  it('인증 + phone_public=true → phone 그대로', () => {
    const result = redactMemberContact(
      { email: null, email_public: false, phone: '010-1234-5678', phone_public: true },
      true
    )
    expect(result.phone).toBe('010-1234-5678')
  })

  it('비인증 + phone_public=true → phone null', () => {
    const result = redactMemberContact(
      { email: null, email_public: false, phone: '010-1234-5678', phone_public: true },
      false
    )
    expect(result.phone).toBeNull()
  })

  it('phone/phone_public 필드 없는 객체 → phone 키 추가하지 않고 안전 처리', () => {
    const result = redactMemberContact(
      { email: 'a@b.com', email_public: true },
      true
    )
    expect(result.email).toBe('a@b.com')
    expect('phone' in result).toBe(false)
  })
})

describe('redactMemberContact — 입력 타입 보존', () => {
  it('다른 필드는 그대로 유지', () => {
    const result = redactMemberContact(
      { id: 'uuid-1', name_ko: '홍길동', email: 'a@b.com', email_public: false },
      true
    )
    expect(result.id).toBe('uuid-1')
    expect(result.name_ko).toBe('홍길동')
    expect(result.email).toBeNull()
  })
})
