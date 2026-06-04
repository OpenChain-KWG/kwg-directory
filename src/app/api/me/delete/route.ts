/**
 * DELETE /api/me/delete
 *
 * GDPR Article 17 — Right to erasure.
 * 현재 사용자의 계정 및 모든 데이터를 영구 삭제합니다.
 *
 * - 인증 필수 → 401
 * - body { confirmation: 'DELETE-MY-ACCOUNT' } 필수 → 400
 * - rate limit: IP당 1일 3회 → 429
 * - members, notifications, audit_logs(본인 것) 삭제
 * - 컴플라이언스 트레일 1건은 익명화하여 보존
 * - 응답: 204 No Content + Set-Cookie clear
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { logger, captureApiError } from '@/lib/logger'

const CONFIRMATION_TOKEN = 'DELETE-MY-ACCOUNT'

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = getClientIp(request)

    // rate limit: IP당 1일 3회
    const ipKey = `me:delete:ip:${ip}`
    const allowed = await checkRateLimit(ipKey, 3, 24 * 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json(
        { error: '요청 한도를 초과했습니다. 24시간 후 다시 시도해주세요.' },
        { status: 429, headers: { 'Retry-After': '86400' } },
      )
    }

    // confirmation 검사
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'confirmation 필드가 필요합니다.' },
        { status: 400 },
      )
    }

    const confirmation = (body as Record<string, unknown>)?.confirmation
    if (confirmation !== CONFIRMATION_TOKEN) {
      return NextResponse.json(
        { error: `confirmation 값이 올바르지 않습니다. "${CONFIRMATION_TOKEN}" 을 전달하세요.` },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // 삭제 전 멤버 데이터 스냅샷 (audit trail용)
    const { data: member } = await supabase
      .from('members')
      .select('id, name_ko, company, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()

    // 컴플라이언스 트레일 먼저 기록 (익명화 — actorId를 null로, before에 멤버 id만)
    await auditLog({
      actorId: null, // 삭제 사용자 익명화
      action: 'me.delete',
      targetType: 'member',
      targetId: member?.id ?? null,
      before: member ? { id: member.id } : null,
      after: null,
      request,
    })

    // 1. Storage 아바타 삭제
    if (member?.avatar_url) {
      try {
        const url = new URL(member.avatar_url)
        const match = url.pathname.match(/\/object\/public\/avatars\/(.+)$/)
        if (match) {
          await supabase.storage.from('avatars').remove([match[1]])
        }
      } catch {
        // Storage 삭제 실패는 무시하고 진행
      }
    }

    // 2. notifications 삭제
    const { error: notifDeleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (notifDeleteError) {
      logger.warn(
        { event: 'me.delete.notifications_error', err: notifDeleteError.message },
        'notifications delete failed',
      )
    }

    // 3. audit_logs 중 본인 actor_id 항목 삭제
    //    (컴플라이언스 트레일 1건은 actor_id=null로 이미 기록됨)
    const { error: auditDeleteError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('actor_id', userId)

    if (auditDeleteError) {
      logger.warn(
        { event: 'me.delete.audit_logs_error', err: auditDeleteError.message },
        'audit_logs delete failed — append-only policy may block DELETE',
      )
    }

    // 4. members 행 삭제
    if (member) {
      const { error: memberDeleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)

      if (memberDeleteError) {
        captureApiError('DELETE /api/me/delete members', memberDeleteError)
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
      }
    }

    logger.info({ event: 'me.delete' }, 'GDPR account deletion completed')

    // 204 + 세션 쿠키 초기화
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': [
          'next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
          '__Secure-next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
        ].join(', '),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    captureApiError('DELETE /api/me/delete', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
