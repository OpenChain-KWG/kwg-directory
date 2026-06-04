import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import AvatarUpload from '@/components/AvatarUpload'
import koMessages from '../../../messages/ko.json'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

function renderAvatar(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      {ui}
    </NextIntlClientProvider>,
  )
}

const mockOnUpload = vi.fn()

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe('AvatarUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('2MB 초과 파일 선택 시 에러 토스트 표시', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://example.com/avatar.jpg' }) })
    )

    renderAvatar(<AvatarUpload userId="user-1" name="홍길동" onUpload={mockOnUpload} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const oversizedFile = makeFile('big.jpg', 'image/jpeg', 3 * 1024 * 1024)

    await user.upload(input, oversizedFile)

    await waitFor(() => {
      expect(screen.getByText('파일 크기는 2MB 이하여야 합니다')).toBeInTheDocument()
    })
    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('허용 외 타입 선택 시 에러 토스트 표시', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://example.com/avatar.jpg' }) })
    )

    renderAvatar(<AvatarUpload userId="user-1" name="홍길동" onUpload={mockOnUpload} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const gifFile = makeFile('anim.gif', 'image/gif', 100 * 1024)

    await user.upload(input, gifFile)

    await waitFor(() => {
      expect(screen.getByText('JPEG, PNG, WebP 파일만 업로드 가능합니다')).toBeInTheDocument()
    })
    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('업로드 성공 시 onUpload 콜백 호출', async () => {
    const user = userEvent.setup()
    const returnUrl = 'https://example.supabase.co/storage/v1/object/public/avatars/user-1/123.jpg'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: returnUrl }) })
    )

    renderAvatar(<AvatarUpload userId="user-1" name="홍길동" onUpload={mockOnUpload} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = makeFile('photo.jpg', 'image/jpeg', 500 * 1024)

    await user.upload(input, validFile)

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(returnUrl)
    })
  })

  it('이름이 있으면 이니셜 아바타 표시', () => {
    renderAvatar(<AvatarUpload userId="user-1" name="홍길동" onUpload={mockOnUpload} />)
    expect(screen.getByText('홍')).toBeInTheDocument()
  })

  it('currentUrl이 있으면 이미지 표시', () => {
    renderAvatar(
      <AvatarUpload
        userId="user-1"
        name="홍길동"
        currentUrl="https://example.com/avatar.jpg"
        onUpload={mockOnUpload}
      />
    )
    expect(screen.getByAltText('프로필 사진')).toBeInTheDocument()
  })
})
