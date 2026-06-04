import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))
vi.mock('@/lib/logger', () => ({ captureApiError: vi.fn() }))

import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { POST } from '@/app/api/upload/avatar/route'

const mockAuth = vi.mocked(auth)
const mockCreateAdminClient = vi.mocked(createAdminClient)

function buildStorageMock(uploadError: unknown = null) {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ error: uploadError }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn(() => ({
      data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg' },
    })),
  }
  return {
    from: vi.fn(),
    storage: { from: vi.fn(() => bucket) },
    _bucket: bucket,
  }
}

/** jsdom FormData가 non-Blob 값을 보존하지 않으므로 formData().get()을 직접 mock */
function makeRequest(file: File | null, prevUrl?: string) {
  const fakeFormData = {
    get: vi.fn((key: string) => {
      if (key === 'file') return file
      if (key === 'prevUrl') return prevUrl ?? null
      return null
    }),
  }
  return {
    formData: vi.fn().mockResolvedValue(fakeFormData),
  } as unknown as Request
}

/** jsdom의 File은 arrayBuffer()를 구현하지 않으므로 fake 객체 사용 */
function makeFile(options: { size?: number; type?: string; name?: string } = {}): File {
  const { size = 1024, type = 'image/jpeg', name = 'avatar.jpg' } = options
  const content = new Uint8Array(size)
  return {
    name,
    type,
    size,
    lastModified: Date.now(),
    arrayBuffer: () => Promise.resolve(content.buffer as ArrayBuffer),
  } as unknown as File
}

describe('POST /api/upload/avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 → 401', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(makeRequest(makeFile()))
    expect(res.status).toBe(401)
  })

  it('파일 없음 → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateAdminClient.mockReturnValue(buildStorageMock() as never)

    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('파일')
  })

  it('2MB 초과 파일 → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateAdminClient.mockReturnValue(buildStorageMock() as never)

    const res = await POST(makeRequest(makeFile({ size: 3 * 1024 * 1024 })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('2MB')
  })

  it('허용되지 않은 파일 타입 → 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateAdminClient.mockReturnValue(buildStorageMock() as never)

    const res = await POST(makeRequest(makeFile({ type: 'image/gif', name: 'avatar.gif' })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('JPEG')
  })

  it('정상 업로드 → 200 + publicUrl 반환', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateAdminClient.mockReturnValue(buildStorageMock() as never)

    const res = await POST(makeRequest(makeFile({ type: 'image/png', name: 'avatar.png' })))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toContain('avatars')
  })

  it('Supabase 업로드 에러 → 500', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateAdminClient.mockReturnValue(buildStorageMock({ message: 'Storage error' }) as never)

    const res = await POST(makeRequest(makeFile()))
    expect(res.status).toBe(500)
  })

  it('prevUrl 포함 시 기존 파일 삭제 호출', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const mock = buildStorageMock()
    mockCreateAdminClient.mockReturnValue(mock as never)

    const prevUrl =
      'https://example.supabase.co/storage/v1/object/public/avatars/user-1/old.jpg'
    await POST(makeRequest(makeFile(), prevUrl))

    expect(mock._bucket.remove).toHaveBeenCalledWith(['user-1/old.jpg'])
  })
})
