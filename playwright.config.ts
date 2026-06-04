import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

// NEXTAUTH_SECRET을 테스트 러너 프로세스에 주입 (세션 쿠키 인코딩용)
// SUPABASE_SERVICE_ROLE_KEY:
//   - 테스트 러너 프로세스에서는 제외 → supabaseAvailable=false → Supabase 의존 테스트 자동 skip
//   - webServer(Next.js dev)에는 전달 → createAdminClient() 정상 동작
loadEnvConfig(process.cwd())
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const IS_PROD_SMOKE = process.env.PW_ENV === 'prod-smoke'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
// 키 삭제는 globalSetup 끝에서 수행 — workers 스폰 전까지 globalSetup이 시딩에 사용함

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // L8 크로스 브라우저: 3 렌더링 엔진 + 모바일 viewport.
    // 기본 실행(chromium)과 분리 — `--project=firefox` 등으로 명시 실행.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: IS_PROD_SMOKE
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          // Feature flag: Directory v2 활성화 (Phase 3 트랙 E E2E 시나리오)
          NEXT_PUBLIC_FF_NEW_DIRECTORY: 'on',
          ...(SUPABASE_SERVICE_ROLE_KEY ? { SUPABASE_SERVICE_ROLE_KEY } : {}),
        },
      },
})
