import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
import { AdminAdminsSchema } from '@/lib/schemas'
import { captureApiError } from '@/lib/logger'
import { auditLog } from '@/lib/audit'

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

    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('user_id, added_at')
      .order('added_at', { ascending: true })

    if (adminsError) {
      return NextResponse.json({ error: adminsError.message }, { status: 500 })
    }

    if (!admins || admins.length === 0) {
      return NextResponse.json([])
    }

    const userIds = admins.map((a) => a.user_id)
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('user_id, name_ko, avatar_url')
      .in('user_id', userIds)

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 })
    }

    const memberMap = new Map((members ?? []).map((m) => [m.user_id, m]))

    const result = admins.map((admin) => {
      const member = memberMap.get(admin.user_id)
      return {
        user_id: admin.user_id,
        added_at: admin.added_at,
        name_ko: member?.name_ko ?? null,
        avatar_url: member?.avatar_url ?? null,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    captureApiError('GET /api/admin/admins', error)
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
    const parsed = AdminAdminsSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { action, user_id } = parsed.data

    if (action === 'remove' && user_id === session.user.id) {
      return NextResponse.json({ error: '본인을 어드민에서 제거할 수 없습니다.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (action === 'remove') {
      const { count } = await supabase
        .from('admins')
        .select('user_id', { count: 'exact', head: true })

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: '마지막 어드민은 제거할 수 없습니다.' }, { status: 400 })
      }

      const { error } = await supabase.from('admins').delete().eq('user_id', user_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await auditLog({
        actorId: session.user.id,
        action: 'admin.remove',
        targetType: 'admin',
        targetId: user_id,
        request,
      })

      return NextResponse.json({ success: true, action: 'removed' })
    }

    // action === 'add'
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('user_id, approved')
      .eq('user_id', user_id)
      .eq('approved', true)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: '승인된 멤버만 어드민으로 추가할 수 있습니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('admins')
      .insert({ user_id })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 어드민입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await auditLog({
      actorId: session.user.id,
      action: 'admin.add',
      targetType: 'admin',
      targetId: user_id,
      request,
    })

    return NextResponse.json({ success: true, action: 'added' })
  } catch (error) {
    captureApiError('PATCH /api/admin/admins', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
