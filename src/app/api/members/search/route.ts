import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { SearchMembersSchema } from '@/lib/schemas'
import { captureApiError } from '@/lib/logger'
import { redactMemberContact } from '@/lib/member-privacy'
import { buildIlikeOrFilter } from '@/lib/search-filter'

const RANDOM_POOL_LIMIT = 100

export async function GET(request: Request) {
  try {
    // Rate limit: IP당 1분 60회
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`members:search:${ip}`, 60, 60_000))) {
      return NextResponse.json(
        { error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    const session = await auth()
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)

    const rawParams = {
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    }

    const parsed = SearchMembersSchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { q, category, sort, page, pageSize } = parsed.data
    const offset = (page - 1) * pageSize

    // random 정렬은 DB 측 ORDER BY random() 으로 처리: LIMIT=100 보장
    if (sort === 'random') {
      let query = supabase
        .from('members')
        .select(
          'id, user_id, name_ko, name_en, company, role, bio, category, email, email_public, linkedin, github, discord, blog, avatar_url, tags, approved, created_at, updated_at',
          { count: 'exact' }
        )
        .eq('approved', true)

      if (q) {
        query = query.or(buildIlikeOrFilter(['name_ko', 'name_en', 'company'], q))
      }
      if (category.length > 0) {
        query = query.in('category', category)
      }

      const { data, error, count } = await query
        .order('id') // Supabase JS v2는 ORDER BY random() 직접 지원 안 하므로 id 정렬 후 limit
        .limit(RANDOM_POOL_LIMIT)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // 클라이언트 사이드에서 shuffle (서버에서 Fisher-Yates)
      const pool = (data ?? []).slice()
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }

      const total = count ?? pool.length
      const sliced = pool.slice(offset, offset + pageSize)
      const totalPages = Math.ceil(Math.min(total, RANDOM_POOL_LIMIT) / pageSize)

      const members = sliced.map((m) => redactMemberContact(m, Boolean(session)))

      return NextResponse.json(
        { members, total, page, pageSize, totalPages },
        {
          headers: {
            'Cache-Control': 'private, no-store',
          },
        }
      )
    }

    // name / recent 정렬
    let query = supabase
      .from('members')
      .select(
        'id, user_id, name_ko, name_en, company, role, bio, category, email, email_public, linkedin, github, discord, blog, avatar_url, tags, approved, created_at, updated_at',
        { count: 'exact' }
      )
      .eq('approved', true)

    if (q) {
      query = query.or(buildIlikeOrFilter(['name_ko', 'name_en', 'company'], q))
    }
    if (category.length > 0) {
      query = query.in('category', category)
    }

    const orderColumn = sort === 'recent' ? 'created_at' : 'name_ko'
    const ascending = sort !== 'recent'

    const { data, error, count } = await query
      .order(orderColumn, { ascending })
      .range(offset, offset + pageSize - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    const members = (data ?? []).map((m) => redactMemberContact(m, Boolean(session)))

    return NextResponse.json(
      { members, total, page, pageSize, totalPages },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    captureApiError('GET /api/members/search', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
