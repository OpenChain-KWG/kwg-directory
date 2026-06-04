import { createAdminClient } from './supabase-admin'

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single()
  return !!data
}

/**
 * MFA 강제 여부 확인 — ADMIN_MFA_REQUIRED=on 시 true
 */
export function isMfaRequired(): boolean {
  return process.env.ADMIN_MFA_REQUIRED === 'on'
}

/**
 * admin 액세스 가능 여부 검사.
 * ADMIN_MFA_REQUIRED=on 시 session에 mfaEnabled=true가 없으면 거부.
 *
 * @param userId   NextAuth session.user.id
 * @param mfaEnabled  session에서 파생된 GitHub 2FA 활성 여부
 * @returns true = 접근 허용, false = 거부
 */
export async function isAdminWithMfa(
  userId: string,
  mfaEnabled: boolean | undefined,
): Promise<boolean> {
  const admin = await isAdmin(userId)
  if (!admin) return false

  if (isMfaRequired() && !mfaEnabled) return false

  return true
}
