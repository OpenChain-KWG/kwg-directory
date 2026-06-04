# OpenChain KWG Directory

> OpenChain Korea Work Group 멤버 소개 — GitHub로 로그인하고 프로필을 등록한 뒤, 운영진 승인을 거쳐 멤버 소개에 게재됩니다.

🌐 **English README:** [README.md](README.md)

[![CI](https://github.com/OpenChain-KWG/kwg-directory/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenChain-KWG/kwg-directory/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## 기능

- GitHub / Google OAuth 로그인
- 운영진 승인 워크플로우 기반 프로필 등록
- 이름·소속 실시간 검색 + 카테고리 필터
- 멤버 상세 보기 (이메일은 로그인 멤버에게만 노출)
- 다크 모드(수동 전환), 한국어 UI (영어 현지화 진행 중)
- 개인정보보호법(PIPA) 준수: `robots.txt` noindex + 개인정보 처리방침

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Row Level Security) |
| 인증 | next-auth v5 (GitHub OAuth) |
| 배포 | Vercel |
| 테스트 | Vitest + React Testing Library + Playwright |
| 언어 | TypeScript |

## 빠른 시작

Node.js 22+, npm 10+, Supabase 프로젝트, GitHub OAuth App이 필요합니다.

```bash
git clone https://github.com/OpenChain-KWG/kwg-directory.git
cd kwg-directory
npm install
cp .env.example .env.local   # 값 채우기 — .env.example 주석 참고
npm run dev                  # http://localhost:3000
```

전체 설정(Supabase 스키마, OAuth 앱, 운영진 등록)과 프로덕션 배포는
**[docs/deployment.md](docs/deployment.md)** 를 참고하세요.

## 문서

| 주제 | 문서 |
|------|------|
| 아키텍처 | [docs/architecture.md](docs/architecture.md) |
| 배포·설정 | [docs/deployment.md](docs/deployment.md) |
| 테스트 | [docs/testing.md](docs/testing.md) |
| 데이터·프라이버시 | [docs/data-policy.md](docs/data-policy.md) |
| 다국어(i18n) | [docs/i18n.md](docs/i18n.md) |
| 디자인 원칙 | [docs/design/principles.md](docs/design/principles.md) |

## 테스트

```bash
npm test            # 단위 + 통합 (Vitest)
npm run test:e2e    # E2E (Playwright)
npm run test:rls    # Supabase RLS 정책 테스트
```

## 보안

- 모든 DB 쓰기는 서버사이드 API Route를 통해서만 허용
- Supabase RLS: `approved = true` 레코드만 공개 조회 가능
- 이메일은 로그인 멤버에게, 그리고 `email_public = true` 인 경우에만 노출
- 보안 HTTP 헤더(CSP, X-Frame-Options, HSTS)는 `next.config.ts` 에 정의
- 프로덕션에서 `NEXTAUTH_SECRET` 가 32자 미만이면 서버 기동 거부

취약점 신고는 [SECURITY.md](SECURITY.md) 를 참고하세요.

## 기여하기

기여를 환영합니다. PR을 열기 전 **[CONTRIBUTING.ko.md](CONTRIBUTING.ko.md)** (한국어) /
**[CONTRIBUTING.md](CONTRIBUTING.md)** (English) 를 읽어주세요.
[행동 강령](CODE_OF_CONDUCT.md) 도 함께 준수해 주세요.

## 라이선스

[Apache License 2.0](LICENSE) · Copyright OpenChain Korea Work Group
