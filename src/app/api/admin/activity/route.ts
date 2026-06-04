import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { captureApiError } from '@/lib/logger'

export type ActivityLogEntry = {
  id: string
  action: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  created_at: string
}

const ACTIVITY_LIMIT = 50

/**
 * GET /api/admin/activity
 *
 * Returns the most recent admin audit-log entries (created_at desc, max 50).
 * Admin-only. The returned actor_id is exposed verbatim because this feed is
 * only ever rendered to authenticated maintainers.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (!(await isAdminWithMfa(session.user.id, session.user.mfaEnabled))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, actor_id, target_type, target_id, created_at')
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_LIMIT)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity: (data ?? []) as ActivityLogEntry[] })
  } catch (error) {
    captureApiError('GET /api/admin/activity', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
