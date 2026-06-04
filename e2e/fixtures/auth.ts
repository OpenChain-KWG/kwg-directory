import { encode } from 'next-auth/jwt'
import type { Page } from '@playwright/test'

const COOKIE_NAME = 'authjs.session-token'
const SECRET = process.env.NEXTAUTH_SECRET ?? 'test-secret-32-chars-minimum-here'

export const TEST_USER = {
  id: 'test-user-id-e2e',
  name: '테스트유저',
  email: 'e2e-user@test.com',
  provider: 'github',
}

export const TEST_ADMIN = {
  id: 'test-admin-id-e2e',
  name: '테스트어드민',
  email: 'e2e-admin@test.com',
  provider: 'github',
}

// 미등록 사용자 전용 — members 테이블에 절대 시딩되지 않는 유저
export const TEST_UNREGISTERED_USER = {
  id: 'test-unregistered-user-e2e',
  name: '미등록유저',
  email: 'e2e-unregistered@test.com',
  provider: 'github',
}

async function setSessionCookie(page: Page, user: typeof TEST_USER) {
  const token = await encode({
    token: {
      name: user.name,
      email: user.email,
      picture: null,
      sub: user.id,
      provider: user.provider,
    },
    secret: SECRET,
    salt: COOKIE_NAME,
  })

  await page.context().addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

export async function loginAsUser(page: Page) {
  await setSessionCookie(page, TEST_USER)
}

export async function loginAsAdmin(page: Page) {
  await setSessionCookie(page, TEST_ADMIN)
}

export async function loginAsUnregisteredUser(page: Page) {
  await setSessionCookie(page, TEST_UNREGISTERED_USER)
}
