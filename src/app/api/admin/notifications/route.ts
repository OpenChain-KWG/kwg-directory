import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdminWithMfa } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { captureApiError } from '@/lib/logger'

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
      .from('notifications')
      .select('id, type, payload, is_read, created_at')
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    captureApiError('GET /api/admin/notifications', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (!(await isAdminWithMfa(session.user.id, session.user.mfaEnabled))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    captureApiError('PATCH /api/admin/notifications', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
