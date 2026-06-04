'use client'

type FetchOptions = RequestInit & { silent401?: boolean }

/**
 * 세션 만료(401) 시 로그인 페이지로 이동하는 fetch 래퍼.
 * Server Component에서는 사용 불가 — Client Component 전용.
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { silent401 = false, ...init } = options
  const response = await fetch(url, init)

  if (response.status === 401 && !silent401) {
    if (typeof window !== 'undefined') {
      alert('로그인이 만료되었습니다. 다시 로그인해주세요.')
      window.location.href = '/api/auth/signin'
    }
  }

  return response
}
