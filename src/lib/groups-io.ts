// groups.io API 클라이언트
// 인증: Basic Auth (API 키를 username으로, 비밀번호 빈 문자열)
// 참고: https://groups.io/api

const GROUPS_IO_BASE = 'https://groups.io/api/v1'

function isConfigured(): boolean {
  return Boolean(process.env.GROUPS_IO_API_KEY && process.env.GROUPS_IO_GROUP_ID)
}

function buildAuthHeader(): string {
  // groups.io Basic Auth: api_key를 username으로, password는 빈 문자열
  const credentials = Buffer.from(`${process.env.GROUPS_IO_API_KEY}:`).toString('base64')
  return `Basic ${credentials}`
}

export async function inviteMember(email: string, name: string): Promise<void> {
  if (!isConfigured()) {
    console.log('[groups.io] GROUPS_IO_API_KEY 또는 GROUPS_IO_GROUP_ID 미설정 — 초대 건너뜀')
    return
  }

  const params = new URLSearchParams({
    group_id: process.env.GROUPS_IO_GROUP_ID!,
    email,
    invite_message: `${name}님, OpenChain KWG 메일링리스트에 초대합니다.`,
  })

  const response = await fetch(`${GROUPS_IO_BASE}/invitemember`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => String(response.status))
    throw new Error(`groups.io invite failed (${response.status}): ${errorText}`)
  }
}
