import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { inviteMember } from '@/lib/groups-io'
import { AdminIdSchema } from '@/lib/schemas'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { captureApiError, logger } from '@/lib/logger'
import { auditLog } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`admin:${ip}`, 30, 60_000))) {
      return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (!(await isAdminWithMfa(session.user.id, session.user.mfaEnabled))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const rawBody = await request.json()
    const parsed = AdminIdSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id } = parsed.data

    const supabase = createAdminClient()

    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('id, name_ko, contact_email, email, subscribe_mailing_list, approved')
      .eq('id', id)
      .single()

    if (fetchError || !member) {
      return NextResponse.json({ error: fetchError?.message ?? '요청한 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!member.approved) {
      return NextResponse.json({ error: '승인된 멤버에게만 재발송할 수 있습니다.' }, { status: 400 })
    }

    const recipientEmail = member.contact_email || member.email
    if (!recipientEmail) {
      return NextResponse.json({ error: '연락 이메일이 없습니다.' }, { status: 400 })
    }

    try {
      await inviteMember(recipientEmail, member.name_ko)
      await supabase
        .from('members')
        .update({ mailing_invite_sent_at: new Date().toISOString(), mailing_invite_error: null })
        .eq('id', id)

      await auditLog({
        actorId: session.user.id,
        action: 'member.reinvite',
        targetType: 'member',
        targetId: id,
        after: { inviteStatus: 'sent' },
        request,
      })

      return NextResponse.json({ success: true, inviteStatus: 'sent' })
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      logger.warn({ memberId: id, err: errorMsg }, '[groups.io] 재발송 실패')
      await supabase
        .from('members')
        .update({ mailing_invite_error: errorMsg })
        .eq('id', id)
      return NextResponse.json(
        { error: `초대 발송 실패: ${errorMsg}`, inviteStatus: 'failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    captureApiError('POST /api/admin/reinvite', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
