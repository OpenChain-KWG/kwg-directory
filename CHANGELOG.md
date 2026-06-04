# Changelog

All notable changes to this project are documented here. This project follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to
[Semantic Versioning](https://semver.org/).

---

## [Unreleased]

> v2 엔터프라이즈/UX 개편 누적분. 실제 `[2.0.0]` 버전·일자 스탬핑은 release 스킬로 출시 시 수행.

### Added
- 디자인 시스템: 디자인 토큰(OKLCH) + Radix 기반 UI 프리미티브 + 패턴 컴포넌트(DataTable, CommandMenu 등)
- 디렉토리 v2: 가상 스크롤 그리드, CommandMenu 검색, 상세 Sheet(인터셉트 라우트), 카테고리/태그 필터
- 프로필: 단일 페이지 ProfileFormV2(등록·편집), 아바타 업로드
- 어드민: DataTable 대기 멤버 관리, 벌크 승인, 활동 피드, 알림, CSV 내보내기, MFA 강제
- i18n: 쿠키 기반 ko/en 로케일 전환(next-intl), 로케일 인지 날짜·숫자 포맷
- GDPR: 내 데이터 내보내기(Art.20)·계정 삭제(Art.17) API + `AccountDataSection` UI
- 관측성: Sentry, 구조적 로거(PII 마스킹), `/api/health`
- API 계약: OpenAPI 3.1 스펙(`docs/api/openapi.yaml`) + 계약 테스트 + k6 부하 스크립트

### Changed
- 폰트 Pretendard 일원화, OS 다크모드 반영 + 테마 토글
- v2 디렉토리 단일 커터오버(v1 표면 은퇴)
- 로케일 라우팅은 쿠키 기반 유지 (ADR-0010 — `[locale]` URL 라우팅 descope)

### Security
- members PII lockdown(RLS), 검색 PostgREST 필터 인젝션 차단, 연락처 redact 불변식
- 감사 로그 append-only(INSERT-only, UPDATE/DELETE 차단)

### Accessibility
- WCAG 2.2 AA: axe 0 violations(공개+인증 페이지), focus trap(Radix), aria-live, container query 그리드

---

## [1.0.0] - 2024-04-09

### Added

- **Auth**: GitHub OAuth sign-in/sign-out (next-auth v5)
- **Member directory**: card grid of approved members
- **Search**: real-time name/company search (300ms debounce)
- **Filters**: four affiliation categories (large enterprise / SME / research·public / startup)
- **Profile registration**: 3-step form (basic info → social links → preview)
- **Member modal**: details on card click (email shown to signed-in members only)
- **Admin page**: approve/reject workflow for operators
- **Database**: Supabase PostgreSQL + RLS policies
  - only `approved = true` records are publicly readable
  - writes go through the service role (API routes)
- **Security**: CSP, X-Frame-Options, HSTS, and other security HTTP headers
- **Privacy**: PIPA compliance — `robots.txt` noindex, privacy policy page
- **Deployment**: Vercel + `vercel.json` configuration
- **Dark mode**: via the `data-theme` attribute
- **Tests**: 40 Vitest unit/integration tests, 10 Playwright E2E tests, 7 pgTAP RLS tests
- **CI**: GitHub Actions (unit + e2e + rls jobs)
- **Docs**: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG
- **GitHub templates**: issue templates (bug, feature), PR template

### Tech Stack

- Next.js 16.2.2 (App Router)
- React 19.2.4
- Tailwind CSS v4
- Supabase JS v2
- next-auth v5 beta
- TypeScript 5
- Vitest 3 + Playwright 1.59

---

[Unreleased]: https://github.com/OpenChain-KWG/kwg-directory/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/OpenChain-KWG/kwg-directory/releases/tag/v1.0.0
