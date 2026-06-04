import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

// NEXTAUTH_SECRET 최소 32자 검증 (A02)
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  if (secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters in production.')
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      issuer: "https://github.com/login/oauth", // RFC 9207 iss check fix
      allowDangerousEmailAccountLinking: true,
      // read:user scope는 GitHub OAuth 기본 포함 — two_factor_authentication 필드 접근 가능
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile) {
        const p = profile as unknown
        if (account.provider === 'github') {
          token.sub = String((p as { id: number }).id)
          // GitHub profile에 two_factor_authentication 필드가 있으면 저장
          // GitHub OAuth 앱은 기본적으로 user 스코프로 이 필드를 제공함
          const ghProfile = p as { id: number; two_factor_authentication?: boolean }
          if (typeof ghProfile.two_factor_authentication === 'boolean') {
            token.mfaEnabled = ghProfile.two_factor_authentication
          }
        } else if (account.provider === 'google') {
          token.sub = (p as { sub: string }).sub
          // Google은 MFA 정보 미제공 — undefined 유지
        }
        token.provider = typeof account.provider === 'string' ? account.provider : undefined
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.provider = token.provider as string | undefined
      session.user.mfaEnabled = token.mfaEnabled as boolean | undefined
      return session
    },
  },
  pages: {
    signIn: '/',
  },
})
