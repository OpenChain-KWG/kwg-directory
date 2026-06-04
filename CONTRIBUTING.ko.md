# 기여 가이드

🌐 **English:** [CONTRIBUTING.md](CONTRIBUTING.md)

KWG Directory에 기여해주셔서 감사합니다. 이 문서는 브랜치 전략, 커밋 컨벤션, PR 규칙을 안내합니다.

## 시작하기 전에

- 기여 전 [행동 강령(CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md)을 읽어주세요.
- 새 기능이나 큰 변경은 먼저 Issue를 열어 논의하세요.
- 보안 취약점은 공개 Issue가 아닌 [SECURITY.md](SECURITY.md) 절차를 따르세요.

## 개발 환경 설정

```bash
git clone https://github.com/OpenChain-KWG/kwg-directory.git
cd kwg-directory
npm install
cp .env.example .env.local
# .env.local 값 채우기 (README.ko.md 참고)
npm run dev
```

## 브랜치 전략

`main` 브랜치가 항상 배포 가능한 상태를 유지합니다. 브랜치 이름은 **소문자 + 하이픈**을 사용합니다.

| 접두사 | 사용 시점 |
|--------|-----------|
| `feat/` | 새로운 기능 |
| `fix/` | 버그 수정 |
| `docs/` | 문서 변경 |
| `refactor/` | 동작 변경 없는 코드 개선 |
| `test/` | 테스트 추가·수정 |
| `chore/` | 빌드, 의존성, CI 등 |

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다.

```
<type>(<scope>): <subject>

[body]

[footer]
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `revert`
- **scope**(선택): `auth`, `members`, `admin`, `ui`, `db`, `ci`, `docs` 등
- subject는 현재형 동사로 시작, 영문은 소문자·마침표 없음
- body는 **무엇**보다 **왜** 바꿨는지 설명
- 한 커밋 = 하나의 논리적 변경

예시:

```
feat(auth): GitHub OAuth 콜백 후 세션 생성 로직 추가
fix(members): 검색 디바운스 300ms 적용 누락 수정
test(api): GET /api/members 통합 테스트 추가
```

## Pull Request 규칙

제목은 커밋 컨벤션과 동일한 형식을 사용합니다.

PR을 열기 전 체크리스트:

- [ ] `npm run build` 통과
- [ ] `npm test` 통과
- [ ] `npm run lint` 경고 없음
- [ ] 변경된 코드에 대응하는 테스트 작성 (신규 컴포넌트·API Route)
- [ ] `npm run test:coverage` 커버리지 70% 유지 확인
- [ ] DB 스키마 변경 시 `npm run test:rls` 통과 확인
- [ ] 관련 문서(`docs/`) 업데이트 완료
- [ ] 민감 정보(키, 토큰, 개인정보) 미포함

리뷰 절차:

1. PR 생성 → CI 자동 실행
2. 코드 리뷰 1인 이상 승인 필요
3. 모든 대화 resolve 후 머지
4. 머지 방식: **Squash and merge**

크기 가이드: 하나의 PR은 하나의 목적, 변경 파일 10개·변경 라인 400줄 이하 권장.

## 코드 스타일

- TypeScript strict 모드 준수
- Tailwind CSS 클래스는 `cn()` 유틸로 조합
- Server Component / Client Component 명확히 구분 (`'use client'` 표시)
- API Route는 항상 인증 검사 후 처리
- 환경변수는 `process.env.*`로만 접근 (하드코딩 금지)

## 테스트 작성

새 기능에는 반드시 테스트를 추가하세요.

```bash
npm test               # 단위·통합 테스트
npm run test:coverage  # 커버리지 (70% 이상 유지)
npm run test:e2e       # E2E 테스트
```

- 단위 테스트: `src/tests/unit/`
- 통합 테스트: `src/tests/integration/`
- E2E 테스트: `e2e/`

## 이슈 등록

- **버그**: [Bug Report 템플릿](.github/ISSUE_TEMPLATE/bug_report.md) 사용
- **기능 요청**: [Feature Request 템플릿](.github/ISSUE_TEMPLATE/feature_request.md) 사용
- 중복 이슈 확인 후 등록해주세요.

---

질문이 있으시면 Discussions 탭을 이용하거나 기존 이슈에 댓글을 남겨주세요.
