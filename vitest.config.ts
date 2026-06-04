/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
// Note: CJS deprecation warning은 Vite 5 → 6 업그레이드 또는 ESM 프로젝트 전환으로 제거 가능
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    server: {
      deps: {
        inline: ['next'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
      },
      exclude: [
        'e2e/**',
        'node_modules/**',
        '.next/**',
        '*.config.*',
        // 페이지·레이아웃: E2E로 커버
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/*-image.tsx',
        'src/app/manifest.ts',
        // 타입 정의만 (런타임 없음)
        'src/types/**',
        // NextAuth 내부 라우트
        'src/app/api/auth/**',
        // 디자인시스템 프리미티브·패턴: Storybook + a11y addon으로 커버 (design-system 규칙 — 모든 ui/patterns 컴포넌트 .stories.tsx 필수)
        'src/components/ui/**',
        'src/components/patterns/**',
        // 복잡한 UI 컴포넌트: E2E + Playwright로 커버
        'src/components/Navbar.tsx',
        'src/components/ProfileFormV2.tsx',
        'src/components/MemberModal.tsx',
        'src/components/MemberGrid.tsx',
        'src/components/AdminManagement.tsx',
        'src/components/admin/PendingMembersTable.tsx',
      ],
    },
    exclude: ['node_modules', '.next', 'e2e/**'],
  },
})
