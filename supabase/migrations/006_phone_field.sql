-- 기능: 전화번호 필드 추가
-- 이유: 멤버가 전화번호를 선택적으로 공개할 수 있도록 함
-- email_public 컬럼은 하위 호환성 유지를 위해 보존

BEGIN;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_public BOOLEAN DEFAULT false;

COMMIT;

-- ROLLBACK:
-- ALTER TABLE members DROP COLUMN IF EXISTS phone;
-- ALTER TABLE members DROP COLUMN IF EXISTS phone_public;
