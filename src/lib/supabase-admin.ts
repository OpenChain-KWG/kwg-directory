import { createClient } from '@supabase/supabase-js'

// 서버 사이드 전용 (API Route, Server Action에서만 사용)
// RLS를 우회하여 모든 레코드에 접근 가능
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
