// 멤버 연락처(email/phone) 공개 범위 마스킹 공유 헬퍼.
// 모든 읽기 경로(page.tsx, /api/members, /api/members/search, /api/members/[id])에서
// 이 단일 함수를 사용해 마스킹 로직 드리프트를 방지한다.

type ContactFields = {
  email?: string | null
  email_public?: boolean | null
  phone?: string | null
  phone_public?: boolean | null
}

/**
 * 인증·공개 여부에 따라 멤버의 연락처 필드를 마스킹한다.
 * - email: `authenticated && email_public` 일 때만 원본, 그 외 null
 * - phone: 객체에 phone/phone_public 필드가 있을 때만 처리,
 *          `authenticated && phone_public` 일 때만 원본, 그 외 null
 *
 * 입력 타입을 제네릭으로 보존하며, 존재하지 않는 필드는 추가하지 않는다.
 */
export function redactMemberContact<T extends ContactFields>(
  member: T,
  authenticated: boolean
): T {
  const redacted: T = {
    ...member,
    email: authenticated && member.email_public ? member.email ?? null : null,
  }

  if ('phone' in member || 'phone_public' in member) {
    redacted.phone = authenticated && member.phone_public ? member.phone ?? null : null
  }

  return redacted
}
