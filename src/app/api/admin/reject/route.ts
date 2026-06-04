import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { sendRejectionEmail } from '@/lib/email'
import { AdminRejectSchema } from '@/lib/schemas'
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
    const parsed = AdminRejectSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id, reason } = parsed.data

    const supabase = createAdminClient()

    const { data: member, error: fetchError } = await supabase
      .from('members')
      .select('id, name_ko, contact_email, email')
      .eq('id', id)
      .single()

    if (fetchError || !member) {
      return NextResponse.json({ error: fetchError?.message ?? '요청한 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { error } = await supabase
      .from('members')
      .update({ rejection_reason: reason })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 감사 로그 기록
    await auditLog({
      actorId: session.user.id,
      action: 'member.reject',
      targetType: 'member',
      targetId: id,
      after: { rejection_reason: reason },
      request,
    })

    // 이메일 발송 (실패해도 거절은 성공으로 처리)
    const recipientEmail = member.contact_email || member.email
    if (recipientEmail) {
      await sendRejectionEmail(
        member.name_ko,
        recipientEmail,
        reason
      ).catch((e: unknown) => {
        logger.warn({ err: e instanceof Error ? e.message : String(e) }, '[email] 거절 이메일 발송 실패')
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureApiError('POST /api/admin/reject', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
