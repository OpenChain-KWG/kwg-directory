-- 기능: OAuth 공급자 정보 컬럼 추가
-- 이유: GitHub 외 Google, 카카오, 네이버 로그인 지원에 따라 멤버 레코드에 provider 정보 저장

BEGIN;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'github';

COMMIT;

-- ROLLBACK:
-- ALTER TABLE members DROP COLUMN IF EXISTS provider;
