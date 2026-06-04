import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { MemberUpdateSchema } from '@/lib/schemas'
import { captureApiError } from '@/lib/logger'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    captureApiError('GET /api/members/me', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const rawBody = await request.json()
    const parsed = MemberUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('members')
      .select('id, name_ko, name_en')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: '멤버 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // name_ko 또는 name_en 변경 시 approved=false로 재설정 (악용 방지)
    const nameChanged =
      body.name_ko !== existing.name_ko ||
      (body.name_en ?? null) !== (existing.name_en ?? null)

    const updateData: Record<string, unknown> = {
      name_ko: body.name_ko,
      name_en: body.name_en || null,
      company: body.company,
      role: body.role || null,
      bio: body.bio || null,
      category: body.category || null,
      email: body.email || null,
      email_public: body.email_public ?? false,
      phone: body.phone || null,
      phone_public: body.phone_public ?? false,
      linkedin: body.linkedin || null,
      github: body.github || null,
      discord: body.discord || null,
      blog: body.blog || null,
      avatar_url: body.avatar_url || null,
      tags: body.tags ?? [],
      contact_email: body.contact_email || null,
      subscribe_mailing_list: body.subscribe_mailing_list ?? true,
      updated_at: new Date().toISOString(),
    }

    if (nameChanged) {
      updateData.approved = false
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    captureApiError('PATCH /api/members/me', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data: member } = await supabase
      .from('members')
      .select('id, avatar_url')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: '멤버 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Storage 아바타 파일 삭제
    if (member.avatar_url) {
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

    const { error } = await supabase.from('members').delete().eq('id', member.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    captureApiError('DELETE /api/members/me', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
