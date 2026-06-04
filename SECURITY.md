# 보안 정책

## 지원되는 버전

| 버전 | 지원 여부 |
|------|-----------|
| 최신 main 브랜치 | ✅ 지원 |
| 이전 릴리스 | ❌ 미지원 |

보안 수정은 main 브랜치에만 제공됩니다.

---

## 취약점 신고 절차

**공개 Issue로 보안 취약점을 신고하지 마세요.** 공개 전 악용될 수 있습니다.

### 신고 방법

다음 중 하나를 이용해 **비공개로** 신고해주세요.

1. **GitHub Security Advisories** (권장)
   - 저장소 → Security 탭 → "Report a vulnerability"
   - [https://github.com/openchain-kwg/kwg-directory/security/advisories/new](https://github.com/openchain-kwg/kwg-directory/security/advisories/new)

2. **이메일**
   - `security@openchain-kwg.example.com`
   - PGP 키가 있는 경우 암호화 권장

### 신고 시 포함할 내용

```
- 취약점 유형 (예: XSS, SQL Injection, IDOR 등)
- 영향받는 컴포넌트 / 파일 경로
- 재현 단계 (가능한 경우 PoC 코드)
- 예상 영향 범위
- 제안하는 수정 방법 (선택)
```

---

## 처리 절차

| 단계 | 소요 시간 | 내용 |
|------|-----------|------|
| 접수 확인 | 48시간 이내 | 신고 수신 확인 회신 |
| 심각도 평가 | 5일 이내 | CVSS 점수 산정 및 영향 분석 |
| 수정 개발 | 심각도에 따라 | Critical: 7일 / High: 14일 / Medium 이하: 30일 |
| 패치 배포 | 수정 완료 후 | main 머지 + Vercel 자동 배포 |
| 공개 공지 | 패치 배포 후 | Security Advisory 공개 |

신고자에게 진행 상황을 정기적으로 업데이트합니다.

---

## 범위 (In Scope)

다음 항목의 취약점을 신고해주세요.

- **인증/인가**: 세션 탈취, 어드민 권한 우회, OAuth 취약점
- **데이터 노출**: 이메일 등 개인정보 무단 열람, RLS 우회
- **인젝션**: SQL Injection, XSS, Command Injection
- **API 보안**: IDOR, 비인증 접근, Rate Limit 우회
- **의존성**: 알려진 CVE가 있는 패키지 사용

---

## 범위 외 (Out of Scope)

- 소셜 엔지니어링 공격
- 물리적 보안 이슈
- DoS/DDoS 공격
- 운영 서버에 실제로 영향을 준 테스트
- 이미 알려진 이슈 (기존 Issue 또는 Advisory에 등록된 것)
- 기능 버그 (보안과 무관한 것)

---

## 감사 표시

책임감 있는 취약점 신고에 감사드립니다. 수정된 취약점은 CHANGELOG 및 Security Advisory에 신고자를 명시합니다 (원하는 경우).
