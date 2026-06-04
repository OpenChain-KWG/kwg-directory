import { Resend } from 'resend'

const KWG_EMAIL = 'korea-sg-planning@lists.openchainproject.org'
const APP_URL = 'https://kwg-directory.vercel.app'
const DISCORD_INVITE = 'https://discord.gg/7AG92D3Cj7'
const KWG_JOIN_URL = 'https://openchain-project.github.io/OpenChain-KWG/about/'

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'KWG Directory <onboarding@resend.dev>'
}

export async function sendApprovalEmail(
  name: string,
  contactEmail: string,
  subscribed: boolean
): Promise<void> {
  const client = getClient()
  if (!client) {
    console.log('[email] RESEND_API_KEY 미설정 — 승인 이메일 발송 건너뜀')
    return
  }

  const mailingListNote = subscribed
    ? `──────────────────────────────
메일링리스트 초대장이 별도 이메일로 발송되었습니다.
이메일을 확인하여 메일링리스트 가입을 완료해주세요.

`
    : ''

  const text = `${name}님, 환영합니다!

KWG 멤버 소개 가입이 승인되었습니다.

아래 링크에서 동료 멤버들의 프로필을 확인하세요.
→ ${APP_URL}

${mailingListNote}저희가 가벼운 소통을 위한 공간으로 Discord를 활용하고 있습니다.
참가를 원하시면 다음 초대 링크를 이용하시기 바랍니다.
→ ${DISCORD_INVITE}

문의: ${KWG_EMAIL}`

  await client.emails.send({
    from: getFromAddress(),
    to: contactEmail,
    subject: '[KWG Directory] 멤버 승인이 완료되었습니다.',
    text,
  })
}

export async function sendNewMemberNotification(member: {
  name_ko: string
  company: string
  role?: string | null
  contact_email: string
  created_at: string
}): Promise<void> {
  const client = getClient()
  if (!client) {
    console.log('[email] RESEND_API_KEY 미설정 — 신규 가입 알림 발송 건너뜀')
    return
  }

  const createdAt = new Date(member.created_at).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const text = `새 멤버 등록 신청이 있습니다.

이름: ${member.name_ko}
소속: ${member.company}
직무: ${member.role ?? '미기재'}
이메일: ${member.contact_email}
신청일: ${createdAt}

관리자 페이지에서 검토해주세요.
→ ${APP_URL}/admin`

  await client.emails.send({
    from: getFromAddress(),
    to: KWG_EMAIL,
    subject: '[KWG Directory] 새 멤버 등록 신청',
    text,
  })
}

export async function sendRejectionEmail(
  name: string,
  contactEmail: string,
  reason: string
): Promise<void> {
  const client = getClient()
  if (!client) {
    console.log('[email] RESEND_API_KEY 미설정 — 거절 이메일 발송 건너뜀')
    return
  }

  const text = `${name}님,

안타깝게도 이번 신청은 승인되지 않았습니다.

사유: ${reason}

KWG 가입 자격 안내:
${KWG_JOIN_URL}

문의 사항이 있으시면 아래로 연락해주세요.
${KWG_EMAIL}`

  await client.emails.send({
    from: getFromAddress(),
    to: contactEmail,
    subject: '[KWG Directory] 멤버 신청 결과 안내',
    text,
  })
}
