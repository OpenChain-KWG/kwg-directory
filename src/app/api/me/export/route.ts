/**
 * GET /api/me/export
 *
 * GDPR Article 20 — Right to data portability.
 * 현재 사용자의 모든 개인정보를 JSON 파일로 내보냅니다.
 *
 * - 인증 필수 → 401
 * - rate limit: IP·user당 1시간 1회 → 429
 * - 본인 데이터만 반환
 * - audit_log 기록 (action: 'me.export')
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { auditLog } from '@/lib/audit'
import { logger, captureApiError } from '@/lib/logger'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id
    const ip = getClientIp(request)

    // rate limit: IP당 + user당 각각 1시간 1회
    const ipKey = `me:export:ip:${ip}`
    const userKey = `me:export:user:${userId}`
    const [ipOk, userOk] = await Promise.all([
      checkRateLimit(ipKey, 1, 60 * 60 * 1000),
      checkRateLimit(userKey, 1, 60 * 60 * 1000),
    ])

    if (!ipOk || !userOk) {
      return NextResponse.json(
        { error: '요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.' },
        { status: 429, headers: { 'Retry-After': '3600' } },
      )
    }

    const supabase = createAdminClient()

    // 멤버 정보
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (memberError) {
      captureApiError('GET /api/me/export members', memberError)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }

    // audit_logs (본인 actor_id로 발생한 기록)
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id, action, target_type, target_id, created_at')
      .eq('actor_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (auditError) {
      logger.warn({ event: 'me.export.audit_logs_error', err: auditError.message }, 'audit_logs fetch failed')
    }

    // notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)

    if (notifError) {
      logger.warn({ event: 'me.export.notifications_error', err: notifError.message }, 'notifications fetch failed')
    }

    const now = new Date()
    const exportedAt = now.toISOString()
    const dateStr = now.toISOString().slice(0, 10)

    const exportPayload = {
      exportedAt,
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        github_username: session.user.provider === 'github' ? (session.user.name ?? null) : null,
      },
      member: member ?? null,
      auditLog: auditLogs ?? [],
      notifications: notifications ?? [],
    }

    // audit_log 기록 (me.export 자체를 기록)
    await auditLog({
      actorId: userId,
      action: 'me.export',
      targetType: 'member',
      targetId: member?.id ?? null,
      request,
    })

    logger.info({ event: 'me.export', userId }, 'GDPR data export requested')

    const filename = `kwg-directory-export-${userId}-${dateStr}.json`
    const body = JSON.stringify(exportPayload, null, 2)

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    captureApiError('GET /api/me/export', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
