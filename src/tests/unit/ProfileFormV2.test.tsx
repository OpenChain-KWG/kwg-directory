import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'

import ProfileFormV2 from '@/components/ProfileFormV2'
import koMessages from '../../../messages/ko.json'

// next/image → plain img (jsdom)
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// next-auth client signOut
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

const USER_ID = 'user-123'

// jsdom localStorage가 일관되지 않아 Map 기반 폴리필을 설치한다.
function installLocalStorage() {
  const store = new Map<string, string>()
  const mock: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: mock,
  })
}

function renderForm(props: Partial<React.ComponentProps<typeof ProfileFormV2>> = {}) {
  return render(
    <NextIntlClientProvider locale="ko" messages={koMessages}>
      <ProfileFormV2 userId={USER_ID} mode="create" {...props} />
    </NextIntlClientProvider>,
  )
}

describe('ProfileFormV2', () => {
  beforeEach(() => {
    installLocalStorage()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('필수 섹션과 핵심 입력 필드를 렌더한다', () => {
    renderForm()
    expect(screen.getByTestId('profile-form')).toBeInTheDocument()
    expect(screen.getByTestId('registration-input-name-ko')).toBeInTheDocument()
    expect(screen.getByTestId('registration-input-company')).toBeInTheDocument()
    expect(
      screen.getByTestId('registration-input-contact-email'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('registration-submit-btn')).toBeInTheDocument()
  })

  it('create 모드: 필수값 미충족 시 제출 버튼이 비활성화된다', () => {
    renderForm()
    expect(screen.getByTestId('registration-submit-btn')).toBeDisabled()
  })

  it('create 모드: 필수값 + 개인정보 동의를 채우면 제출 버튼이 활성화된다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(
      screen.getByTestId('registration-input-name-ko'),
      '홍길동',
    )
    await user.type(
      screen.getByTestId('registration-input-company'),
      '오픈체인',
    )
    await user.type(
      screen.getByTestId('registration-input-contact-email'),
      'gildong@example.com',
    )
    // 제출 버튼은 개인정보 동의 전까지 비활성
    expect(screen.getByTestId('registration-submit-btn')).toBeDisabled()

    await user.click(screen.getByTestId('profile-form-privacy-checkbox'))
    expect(screen.getByTestId('registration-submit-btn')).toBeEnabled()
  })

  it('이름 필드 blur 시 비어 있으면 inline 에러를 표시한다', async () => {
    const user = userEvent.setup()
    renderForm()
    const nameInput = screen.getByTestId('registration-input-name-ko')
    await user.click(nameInput)
    await user.tab()
    await waitFor(() => {
      expect(
        screen.getByText(koMessages.profileForm.validation.nameKoRequired),
      ).toBeInTheDocument()
    })
  })

  it('제출 성공 시 인라인 성공 화면을 보여주고 draft를 삭제한다', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-member', approved: false }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderForm()
    await user.type(screen.getByTestId('registration-input-name-ko'), '홍길동')
    await user.type(
      screen.getByTestId('registration-input-company'),
      '오픈체인',
    )
    await user.type(
      screen.getByTestId('registration-input-contact-email'),
      'gildong@example.com',
    )
    await user.click(screen.getByTestId('profile-form-privacy-checkbox'))
    await user.click(screen.getByTestId('registration-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('registration-success')).toBeInTheDocument()
    })
    // POST /api/members 호출 + privacy_agreed_at 포함
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/members')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.privacy_agreed_at).toBeTruthy()
    // draft 삭제됨
    expect(window.localStorage.getItem(`kwg:profile-draft:${USER_ID}`)).toBeNull()
  })

  it('제출 버튼 더블클릭 시 POST는 한 번만 호출된다', async () => {
    const user = userEvent.setup()
    let resolveFetch: (v: unknown) => void = () => {}
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderForm()
    await user.type(screen.getByTestId('registration-input-name-ko'), '홍길동')
    await user.type(
      screen.getByTestId('registration-input-company'),
      '오픈체인',
    )
    await user.type(
      screen.getByTestId('registration-input-contact-email'),
      'gildong@example.com',
    )
    await user.click(screen.getByTestId('profile-form-privacy-checkbox'))

    const btn = screen.getByTestId('registration-submit-btn')
    await user.click(btn)
    await user.click(btn)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolveFetch({ ok: true, json: async () => ({ id: 'x' }) })
    await waitFor(() => {
      expect(screen.getByTestId('registration-success')).toBeInTheDocument()
    })
  })

  it('제출 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: '등록 실패' }),
      }),
    )

    renderForm()
    await user.type(screen.getByTestId('registration-input-name-ko'), '홍길동')
    await user.type(
      screen.getByTestId('registration-input-company'),
      '오픈체인',
    )
    await user.type(
      screen.getByTestId('registration-input-contact-email'),
      'gildong@example.com',
    )
    await user.click(screen.getByTestId('profile-form-privacy-checkbox'))
    await user.click(screen.getByTestId('registration-submit-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-form-error')).toHaveTextContent(
        '등록 실패',
      )
    })
  })

  it('create 모드: 입력값을 localStorage draft에 저장한다', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByTestId('registration-input-name-ko'), '임시저장')

    await waitFor(
      () => {
        const raw = window.localStorage.getItem(`kwg:profile-draft:${USER_ID}`)
        expect(raw).toBeTruthy()
        expect(JSON.parse(raw as string).name_ko).toBe('임시저장')
      },
      { timeout: 2000 },
    )
  })

  it('create 모드: 마운트 시 저장된 draft를 복원한다', async () => {
    window.localStorage.setItem(
      `kwg:profile-draft:${USER_ID}`,
      JSON.stringify({ name_ko: '복원이름', company: '복원기업' }),
    )
    renderForm()
    await waitFor(() => {
      expect(screen.getByTestId('registration-input-name-ko')).toHaveValue(
        '복원이름',
      )
      expect(screen.getByTestId('registration-input-company')).toHaveValue(
        '복원기업',
      )
    })
  })

  it('edit 모드: 초기 데이터를 채우고 탈퇴 버튼을 표시한다', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={koMessages}>
        <ProfileFormV2
          userId={USER_ID}
          mode="edit"
          initialData={{
            id: 'm1',
            user_id: USER_ID,
            name_ko: '기존이름',
            company: '기존기업',
            email_public: false,
            phone_public: false,
            approved: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      </NextIntlClientProvider>,
    )
    expect(screen.getByTestId('registration-input-name-ko')).toHaveValue(
      '기존이름',
    )
    expect(screen.getByTestId('profile-form-withdraw-btn')).toBeInTheDocument()
    // edit 모드는 개인정보 동의 체크박스 없음 → 필수값이 채워져 있으므로 활성
    expect(screen.getByTestId('registration-submit-btn')).toBeEnabled()
  })

  it('라이브 미리보기 카드에 입력한 이름이 반영된다', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(
      screen.getByTestId('registration-input-name-ko'),
      '미리보기',
    )
    const preview = screen.getByTestId('profile-form-preview')
    await waitFor(() => {
      expect(within(preview).getByText('미리보기')).toBeInTheDocument()
    })
  })
})
