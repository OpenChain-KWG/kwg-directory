# 배포 가이드

Vercel + Supabase 조합으로 배포하는 방법을 안내합니다.

## 목차

- [사전 준비](#사전-준비)
- [Supabase 프로젝트 설정](#supabase-프로젝트-설정)
- [GitHub OAuth App 설정](#github-oauth-app-설정)
- [Vercel 배포](#vercel-배포)
- [환경변수 설정](#환경변수-설정)
- [배포 후 검증](#배포-후-검증)
- [멤버 운영 (승인·삭제)](#멤버-운영-승인삭제)
- [운영 체크리스트](#운영-체크리스트)

---

## 사전 준비

- [ ] GitHub 계정
- [ ] [Supabase](https://supabase.com) 계정 (Free Tier 가능)
- [ ] [Vercel](https://vercel.com) 계정 (Free Tier 가능)
- [ ] 저장소를 GitHub에 push한 상태

---

## Supabase 프로젝트 설정

### 1. 프로젝트 생성

1. Supabase Dashboard → **New Project**
2. 프로젝트 이름: `kwg-directory` (자유롭게 설정)
3. 데이터베이스 비밀번호를 안전하게 저장
4. 리전: `ap-northeast-2` (서울) 또는 가까운 리전 선택

### 2. DB 스키마 적용

Supabase Dashboard → **SQL Editor** → 새 쿼리에 아래 파일 내용을 붙여넣고 실행:

```
supabase/migrations/001_init.sql
```

또는 Supabase CLI 사용:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결 (프로젝트 ID는 Dashboard URL에서 확인)
supabase link --project-ref <프로젝트-ID>

# 마이그레이션 적용
supabase db push
```

### 3. API 키 확인

Supabase Dashboard → **Settings** → **API**:

| 항목 | 환경변수명 |
|------|-----------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

> `service_role` 키는 서버 환경에만 설정하세요. 클라이언트에 절대 노출하지 마세요.

---

## GitHub OAuth App 설정

### 1. OAuth App 생성

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 입력 항목:
   - **Application name**: `KWG Directory`
   - **Homepage URL**: `https://your-domain.vercel.app`
   - **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
3. **Register application** 클릭

### 2. Client ID / Secret 확인

생성된 앱에서:
- **Client ID** → `GITHUB_CLIENT_ID`
- **Generate a new client secret** → `GITHUB_CLIENT_SECRET`

> Client Secret은 한 번만 표시됩니다. 즉시 저장하세요.

---

## 소셜 OAuth 앱 설정 (선택)

GitHub 외에 Google, 카카오, 네이버 로그인을 활성화하려면 각 플랫폼에서 OAuth 앱을 생성해야 합니다. 설정하지 않은 공급자는 로그인 버튼이 표시되지만 인증이 실패합니다.

### Google

1. [Google Cloud Console](https://console.cloud.google.com) → **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** → **웹 애플리케이션**
3. 승인된 리디렉션 URI 추가: `https://your-domain.vercel.app/api/auth/callback/google`
4. 클라이언트 ID → `GOOGLE_CLIENT_ID`, 클라이언트 보안 비밀 → `GOOGLE_CLIENT_SECRET`

### 카카오

1. [카카오 개발자 콘솔](https://developers.kakao.com) → **내 애플리케이션** → **애플리케이션 추가하기**
2. **앱 설정** → **플랫폼** → **Web** 플랫폼 등록: `https://your-domain.vercel.app`
3. **카카오 로그인** → **활성화** → **Redirect URI** 추가: `https://your-domain.vercel.app/api/auth/callback/kakao`
4. REST API 키 → `KAKAO_CLIENT_ID`, **보안** → 코드 생성 → `KAKAO_CLIENT_SECRET`

### 네이버

1. [네이버 개발자 센터](https://developers.naver.com) → **Application** → **애플리케이션 등록**
2. 사용 API: **네이버 로그인** 선택
3. 서비스 URL: `https://your-domain.vercel.app`
4. Callback URL: `https://your-domain.vercel.app/api/auth/callback/naver`
5. 클라이언트 ID → `NAVER_CLIENT_ID`, 클라이언트 시크릿 → `NAVER_CLIENT_SECRET`

---

## Vercel 배포

### 1. 저장소 연결

1. Vercel Dashboard → **Add New Project**
2. GitHub 저장소 `kwg-directory` 선택
3. **Import** 클릭

### 2. 빌드 설정 확인

Vercel이 자동으로 감지하지만 `vercel.json`이 있으므로 별도 설정 불필요:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

### 3. 환경변수 설정

**Settings** → **Environment Variables**에 아래 변수를 추가합니다.

> **Production** 환경에만 설정하는 것을 권장합니다.

---

## 환경변수 설정

| 변수명 | 예시 값 | 비고 |
|--------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard에서 확인 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | **서버 전용** (절대 클라이언트에 노출 금지) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 결과 | **32자 이상 필수** |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | 배포 URL로 설정 |
| `GITHUB_CLIENT_ID` | `Ov23li...` | GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | `abc123...` | GitHub OAuth App |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Google Cloud Console OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google Cloud Console OAuth 2.0 |
| `KAKAO_CLIENT_ID` | `abc123...` | 카카오 개발자 앱 REST API 키 |
| `KAKAO_CLIENT_SECRET` | `abc123...` | 카카오 개발자 앱 보안 코드 |
| `NAVER_CLIENT_ID` | `abc123...` | 네이버 개발자 앱 클라이언트 ID |
| `NAVER_CLIENT_SECRET` | `abc123...` | 네이버 개발자 앱 클라이언트 시크릿 |

### NEXTAUTH_SECRET 생성

```bash
openssl rand -base64 32
```

### 배포 후 GitHub OAuth App 업데이트

Vercel 배포 완료 후 실제 도메인으로 OAuth App callback URL 업데이트:

```
https://kwg-directory.vercel.app/api/auth/callback/github
```

---

## 배포 후 검증

### 체크리스트

- [ ] `https://your-domain.vercel.app` 접속 확인
- [ ] GitHub 로그인 동작 확인
- [ ] Google 로그인 동작 확인 (GOOGLE_CLIENT_ID 설정 시)
- [ ] 카카오 로그인 동작 확인 (KAKAO_CLIENT_ID 설정 시)
- [ ] 네이버 로그인 동작 확인 (NAVER_CLIENT_ID 설정 시)
- [ ] `https://your-domain.vercel.app/privacy` 접속 확인
- [ ] `https://your-domain.vercel.app/robots.txt` 확인 (`Disallow: /` 포함)
- [ ] 보안 헤더 확인: [securityheaders.com](https://securityheaders.com) 에서 URL 입력

### 운영진 계정 등록

배포 후 최소 1명의 운영진을 등록해야 멤버 승인이 가능합니다:

```sql
-- Supabase SQL Editor에서 실행
-- GitHub 사용자 ID 확인: https://api.github.com/users/{username}
-- "id" 필드의 숫자 값을 사용
INSERT INTO admins (user_id) VALUES ('123456789');
```

---

## 멤버 운영 (승인·삭제)

### 승인 워크플로우

```
프로필 등록 → approved=false 저장 → 운영진이 /admin 에서 검토
                                          ├─ 승인: approved=true → 멤버 소개에 게재
                                          └─ 거절: 레코드 삭제 (재등록 가능)
```

운영진 계정으로 로그인 후 `/admin` 에 접속하면 승인 대기 멤버 목록이 표시됩니다. 비운영진이 접근하면 403 또는 홈으로 리디렉션됩니다. 승인/거절은 각 행의 버튼으로 처리합니다.

SQL Editor로 직접 처리할 수도 있습니다:

```sql
-- 대기 멤버 조회
SELECT id, name_ko, company, created_at FROM members WHERE approved = false ORDER BY created_at;

-- 수동 승인
UPDATE members SET approved = true WHERE id = 'uuid-here';
```

### 개인정보 삭제 요청 처리

멤버가 프로필/개인정보 삭제를 요청하면 본인 계정을 확인한 뒤 해당 레코드를 삭제합니다.

```sql
DELETE FROM members WHERE user_id = 'oauth-user-id';
```

삭제 요청은 지체 없이 처리합니다. 처리 기한·수집 항목·공개 범위 등 자세한 정책은 [docs/data-policy.md](data-policy.md)를 따릅니다.

---

## 운영 체크리스트

### 정기 점검

- [ ] Supabase Free Tier 용량 확인 (월 500MB)
- [ ] Vercel 빌드 로그 및 Function 로그 확인
- [ ] 멤버 등록 대기 목록 정기 검토
- [ ] 의존성 보안 업데이트: `npm audit`

### 백업

Supabase Dashboard → **Settings** → **Database** → **Backups**에서 주기적 백업을 설정합니다. Free Tier는 7일 자동 백업을 제공합니다.

### 도메인 설정 (선택)

커스텀 도메인 사용 시:
1. Vercel Dashboard → **Settings** → **Domains** → 도메인 추가
2. DNS 레코드 설정 (Vercel 안내 따름)
3. `NEXTAUTH_URL` 환경변수를 새 도메인으로 업데이트
4. GitHub OAuth App callback URL도 새 도메인으로 업데이트
