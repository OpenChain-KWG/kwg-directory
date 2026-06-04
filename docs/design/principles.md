# KWG Directory 디자인 원칙

> 이 문서는 KWG Directory 디자인·UI 작업의 실용 가이드이자 디자인 결정의 기준 문서입니다.

## 1. 핵심 원칙

### 신뢰 우선
- 사용자: 대기업 법무·오픈소스 컴플라이언스 담당, 시니어 엔지니어
- 친근함보다 정제미·전문성
- 과시적·장식적 요소 배제

### 정보 밀도와 호흡의 균형
- Stripe식 generous spacing — 정보 사이 호흡
- Linear식 정보 밀도 — admin·검색 화면
- 두 톤이 섞이되 페이지 성격에 맞춰 비중 조정

### 일관성 > 창의성
- 모든 화면이 같은 토큰·같은 컴포넌트·같은 패턴 사용
- "이번만 예외"는 디자인 시스템의 적

### 정보 전달 우선
- 모션은 의미 전달 도구, 장식 도구 아님
- 컬러는 의미 분류 도구 (success/warning/danger), 장식 도구 아님
- 일러스트는 빈 상태·에러를 친화적으로 만드는 도구, 페이지 hero 장식 아님

## 2. Do / Don't

### 색상

✅ **Do**
- semantic alias 우선 (`bg-surface`, `text-muted`, `border-subtle`)
- KWG teal은 액센트로만 — primary CTA, 강조 링크, focus ring
- 다크모드 대응 명시 (`bg-surface dark:bg-surface-dark` 또는 OKLCH 자동)

❌ **Don't**
- hex 색상 직접 사용 (`#01696f`) — 토큰만 허용
- 임의 hue 추가 — 정의된 12 hue 안에서 해결
- 채도 높은 색상 다중 사용 — KWG teal 1개만

### 타이포그래피

✅ **Do**
- Pretendard Variable 일원화
- 위계는 size + weight 조합으로 표현
- line-height·letter-spacing은 size 토큰과 페어로 정의된 값 사용

❌ **Don't**
- 다른 폰트 패밀리 추가 (Instrument Serif, Noto Sans KR 등) — Pretendard만
- `text-[14px]` 같은 임의 크기 — Tailwind size key 사용
- 본문에 `font-light` (200, 300) — 한글 가독성 저하

### 공백

✅ **Do**
- 4px 그리드 (`p-1` ~ `p-24`)
- 컴포넌트 내부는 작게(2~4), 컴포넌트 사이는 크게(6~12)
- 섹션 사이는 더 크게(16~24)

❌ **Don't**
- `p-[12px]` 같은 임의값
- 반응형마다 미세 조정 (`p-3 md:p-3.5 lg:p-4`) — 2~3 단계로 충분

### 보더 / 그림자

✅ **Do**
- 보더 우선 — `border border-subtle` 로 구획
- shadow는 elevation 강조가 필요할 때만 (모달, 드롭다운, hover lift)
- focus ring은 `ring-2 ring-primary ring-offset-2`

❌ **Don't**
- 카드마다 그림자 — Stripe·Linear 카드는 보더만
- 다단계 그림자 누적
- glow·neon 효과

### 라운드

✅ **Do**
- 통일된 radius — 카드 `rounded-lg`(8px), 버튼 `rounded-md`(6px), input `rounded-md`
- pill·circle은 의도가 명확할 때만 (avatar, status badge)

❌ **Don't**
- 페이지마다 다른 radius
- `rounded-[14px]` 같은 임의값

### 모션

✅ **Do**
- duration 200ms 이하 기본
- ease-out 또는 spring (자연스러운 감속)
- `prefers-reduced-motion` 분기 필수

❌ **Don't**
- 페이지 진입마다 fade-in (피로감)
- bounce·overshoot 강한 모션 (장식적)
- 500ms 초과 (사용자 대기)

### 컴포넌트 사용

✅ **Do**
- `src/components/ui/` 프리미티브 우선 사용
- 패턴이 반복되면 `src/components/patterns/` 로 추출
- 도메인 컴포넌트는 프리미티브 합성으로

❌ **Don't**
- 같은 기능 prefix 다른 자체 구현 (예: 자체 Modal)
- 프리미티브 prop API 임의 확장 — design-system 합의 후
- 프리미티브 직접 수정 (frontend 에이전트는 ui/ 수정 금지)

### 접근성

✅ **Do**
- semantic HTML 우선 (button, a, label)
- 모든 interactive 요소 → accessible name + focus-visible ring
- 색상 대비 4.5:1 (텍스트), 3:1 (UI)
- 모달·시트 → focus trap + Esc 종료

❌ **Don't**
- `<div onClick>` (button·a 사용)
- 컬러로만 의미 전달 (아이콘·텍스트 병행)
- 터치 타겟 44×44px 미만 (모바일)

### 카피·문구

✅ **Do**
- 명확하고 짧게
- 사용자 목표 중심 ("프로필 등록" > "새 멤버 추가")
- 에러 메시지는 다음 행동 안내 ("다시 입력해주세요" > "잘못된 입력")
- 모든 사용자 노출 문자열은 메시지 파일 사용 (i18n)

❌ **Don't**
- 컴포넌트 안 한글 하드코딩
- 형식적 표현 ("환영합니다, 사용자님")
- 기술적 용어 그대로 노출 ("HTTP 500" > "일시적 오류")

## 3. 페이지 패턴 가이드

### 디렉토리 (`/`)
- Hero (선택) → 검색·필터 sticky → 카드 그리드
- 카드는 정보 밀도 높게, 그리드 사이 간격은 generous
- 상세는 Sheet (Intercepting Route)

### 폼 (`/profile/new`, `/admin/...`)
- 단일 페이지 + 섹션 그룹핑
- inline validation
- autosave draft (긴 폼만)
- 제출 후 success 화면 또는 toast

### 데이터 테이블 (`/admin`)
- TanStack Table + sticky header
- 다중 선택 + 벌크 액션
- 행 클릭 → 사이드 sheet (모달 아님)

### 빈 상태
- 일러스트 + 1줄 설명 + 다음 행동 CTA
- 컬러풀하지 않게 — KWG teal 단색 fill

## 4. 반응형 단계

```
mobile:    < 640px  (카드 1~2열, 바텀시트 패턴)
tablet:    640~1024 (카드 2~3열)
desktop:   > 1024   (카드 4열, 사이드바 패턴)
```

Container query 우선 — 카드는 그리드 폭에 따라 자체 레이아웃 결정.

## 5. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-05 | 초기 작성 (Phase 0) |
