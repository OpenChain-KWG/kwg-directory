import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { MemberPatchSchema } from '@/lib/schemas'
import { captureApiError } from '@/lib/logger'
import { redactMemberContact } from '@/lib/member-privacy'

type Params = Promise<{ id: string }>

export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const session = await auth()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .eq('approved', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '멤버를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(
      redactMemberContact(data, Boolean(session)),
      { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' } }
    )
  } catch (error) {
    captureApiError('GET /api/members/[id]', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: member } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!member || member.user_id !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const rawBody = await request.json()
    const parsed = MemberPatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const { data, error } = await supabase
      .from('members')
      .update({
        name_ko: body.name_ko,
        name_en: body.name_en || null,
        company: body.company,
        role: body.role || null,
        bio: body.bio || null,
        category: body.category || null,
        email: body.email || null,
        email_public: body.email_public ?? false,
        linkedin: body.linkedin || null,
        github: body.github || null,
        discord: body.discord || null,
        blog: body.blog || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    captureApiError('PATCH /api/members/[id]', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: member } = await supabase
      .from('members')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!member || member.user_id !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureApiError('DELETE /api/members/[id]', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
