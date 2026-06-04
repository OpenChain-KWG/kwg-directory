import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { MemberCreateSchema } from '@/lib/schemas'
import { captureApiError } from '@/lib/logger'
import { sendNewMemberNotification } from '@/lib/email'
import { redactMemberContact } from '@/lib/member-privacy'
import { buildIlikeOrFilter } from '@/lib/search-filter'

const PAGE_SIZE_DEFAULT = 20
const PAGE_SIZE_MAX = 50

export async function GET(request: Request) {
  try {
    const session = await auth()
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)

    // 페이지네이션 파라미터
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get('limit') ?? PAGE_SIZE_DEFAULT)))
    const offset = (page - 1) * limit

    // 필터 파라미터
    const search = searchParams.get('search') ?? ''
    const category = searchParams.get('category') ?? ''
    const tagsParam = searchParams.get('tags') ?? ''
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
    // 단일 tag 파라미터도 하위 호환 지원
    const singleTag = searchParams.get('tag')
    if (singleTag && !tags.includes(singleTag)) tags.push(singleTag)

    let query = supabase
      .from('members')
      .select(
        'id, user_id, name_ko, name_en, company, role, bio, category, email, email_public, phone, phone_public, linkedin, github, discord, blog, avatar_url, tags, approved, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('approved', true)

    if (search) {
      query = query.or(buildIlikeOrFilter(['name_ko', 'company'], search))
    }
    if (category && category !== '전체') {
      query = query.eq('category', category)
    }
    if (tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    const { data, error, count } = await query
      .order('name_ko', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)

    const members = (data ?? []).map((m) => redactMemberContact(m, Boolean(session)))

    return NextResponse.json(
      { data: members, total, page, totalPages },
      {
        headers: {
          // 로그인 유저 전용이므로 private. 60초 캐시, 5분 백그라운드 갱신
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    captureApiError('GET /api/members', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`members:post:${ip}`, 5, 60_000))) {
      return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const rawBody = await request.json()
    const parsed = MemberCreateSchema.safeParse(rawBody)
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
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '이미 프로필이 존재합니다.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('members')
      .insert({
        user_id: session.user.id,
        provider: session.user.provider ?? null,
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
        avatar_url: body.avatar_url || session.user.image || null,
        tags: body.tags ?? [],
        contact_email: body.contact_email,
        subscribe_mailing_list: body.subscribe_mailing_list,
        privacy_agreed_at: body.privacy_agreed_at,
        approved: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 관리자 알림 등록 (실패해도 멤버 등록은 성공으로 처리)
    await Promise.resolve(
      supabase.from('notifications').insert({
        type: 'new_member_registration',
        payload: {
          name_ko: body.name_ko,
          company: body.company,
          user_id: session.user.id,
        },
      })
    ).catch(() => undefined)

    // 관리자 알림 이메일 발송 (실패해도 등록은 성공으로 처리)
    sendNewMemberNotification({
      name_ko: body.name_ko,
      company: body.company,
      role: body.role,
      contact_email: body.contact_email,
      created_at: data.created_at,
    }).catch((e: unknown) => {
      captureApiError('sendNewMemberNotification', e)
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    captureApiError('POST /api/members', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
