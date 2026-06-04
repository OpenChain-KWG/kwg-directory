import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { captureApiError } from '@/lib/logger'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

function extractPathFromUrl(url: string): string | null {
  const marker = '/storage/v1/object/public/avatars/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`avatar:${ip}`, 10, 60_000))) {
      return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const prevUrl = formData.get('prevUrl') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기는 2MB 이하여야 합니다' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'JPEG, PNG, WebP 파일만 업로드 가능합니다' }, { status: 400 })
    }

    const userId = session.user.id
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`

    const supabase = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (prevUrl) {
      const prevPath = extractPathFromUrl(prevUrl)
      if (prevPath) {
        await supabase.storage.from('avatars').remove([prevPath])
      }
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    captureApiError('POST /api/upload/avatar', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
