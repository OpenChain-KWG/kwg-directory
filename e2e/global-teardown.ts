import { loadEnvConfig } from '@next/env'
import { cleanupTestData } from './fixtures/supabase'

export default async function globalTeardown() {
  // globalSetup 끝에서 삭제된 키를 force=true로 복원 (캐시 우회 + 초기 스냅샷 복구)
  loadEnvConfig(process.cwd(), undefined, console, true)
  await cleanupTestData()
}
