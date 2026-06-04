import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { AdminMembersSchema } from '@/lib/schemas'
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
      .from('members')
      .select('*')
      .eq('approved', false)
      .is('rejection_reason', null)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    captureApiError('GET /api/admin/members', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    if (!(await isAdminWithMfa(session.user.id, session.user.mfaEnabled))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const rawBody = await request.json()
    const parsed = AdminMembersSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id, approved } = parsed.data

    const supabase = createAdminClient()

    if (!approved) {
      // 거절 → rejection_reason 설정 (레코드 유지)
      const { error } = await supabase
        .from('members')
        .update({ rejection_reason: '운영진 검토 결과 미승인' })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, action: 'rejected' })
    }

    const { data, error } = await supabase
      .from('members')
      .update({ approved: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'approved', data })
  } catch (error) {
    captureApiError('PATCH /api/admin/members', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
