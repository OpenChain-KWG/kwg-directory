import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { isAdminWithMfa } from '@/lib/admin'
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
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const members = data ?? []

    const headerRow = [
      '이름(한글)', '이름(영문)', '소속', '역할', '분류',
      '이메일', '전화번호', 'LinkedIn', 'GitHub',
      '관심분야태그', '등록일', '승인여부',
    ]

    const dataRows = members.map((m) => [
      m.name_ko ?? '',
      m.name_en ?? '',
      m.company ?? '',
      m.role ?? '',
      m.category ?? '',
      m.email ?? '',
      m.phone ?? '',
      m.linkedin ?? '',
      m.github ?? '',
      Array.isArray(m.tags) ? m.tags.join(';') : '',
      m.created_at ? m.created_at.split('T')[0] : '',
      m.approved ? 'Y' : 'N',
    ])

    const csv = [headerRow, ...dataRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

    const today = new Date().toISOString().split('T')[0]

    return new NextResponse('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kwg-members-${today}.csv"`,
      },
    })
  } catch (error) {
    captureApiError('GET /api/admin/export/csv', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
