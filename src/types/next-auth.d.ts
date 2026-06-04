import { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      provider?: string
      /** GitHub 계정의 2FA 활성 여부. GitHub OAuth 전용. Google OAuth는 undefined. */
      mfaEnabled?: boolean
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    provider?: string
    /** GitHub two_factor_authentication 필드 캐시 */
    mfaEnabled?: boolean
  }
}
