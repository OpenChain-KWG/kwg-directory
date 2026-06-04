-- anon 롤에 대한 INSERT/UPDATE/DELETE 권한 명시적 차단
-- 이유: RLS 정책만으로는 UPDATE 시 0 rows affected로 예외 없이 통과되어
--       pgTAP throws_ok 테스트가 실패함.
--       REVOKE로 권한을 제거하면 42501 permission denied 예외가 발생함.

BEGIN;

-- anon 롤: SELECT 제외 모든 쓰기 권한 차단
REVOKE INSERT, UPDATE, DELETE ON members FROM anon;
REVOKE INSERT, UPDATE, DELETE ON admins FROM anon;

-- authenticated 롤: 직접 쓰기 차단 (서비스 롤 API Route만 허용)
REVOKE INSERT, UPDATE, DELETE ON admins FROM authenticated;

-- ROLLBACK:
-- GRANT INSERT, UPDATE, DELETE ON members TO anon;
-- GRANT INSERT, UPDATE, DELETE ON admins TO anon;
-- GRANT INSERT, UPDATE, DELETE ON admins TO authenticated;

COMMIT;
