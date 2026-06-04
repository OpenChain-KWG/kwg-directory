-- RLS 재귀 참조 버그 수정
-- 이유: 009_directory_access_rls.sql에서 추가한 approved_members_or_admins_can_view 정책이
--       members 테이블의 SELECT 정책 내에서 members 테이블을 다시 SELECT하여 무한 재귀 발생.
--       psql ERROR: infinite recursion detected in policy for relation "members"

BEGIN;

-- 기존 재귀 정책 삭제
DROP POLICY IF EXISTS "approved_members_or_admins_can_view" ON members;

-- SECURITY DEFINER 함수로 재귀 우회
-- 함수 내에서 RLS가 적용되지 않으므로 재귀 없이 현재 사용자의 승인 상태를 조회할 수 있음
CREATE OR REPLACE FUNCTION get_my_member_status()
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT
    CASE
      WHEN approved = true THEN 'approved'
      ELSE 'pending'
    END
  FROM members
  WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  LIMIT 1;
$$;

-- 재귀 없는 정책으로 교체
-- 자기 자신의 row는 항상 조회 가능 (프로필 수정 등을 위해)
CREATE POLICY "members_select_own"
  ON members FOR SELECT
  TO authenticated
  USING (
    user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );

-- 승인된 멤버 또는 관리자는 전체 조회 가능
CREATE POLICY "members_select_approved_or_admin"
  ON members FOR SELECT
  TO authenticated
  USING (
    get_my_member_status() = 'approved'
    OR EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );

-- ROLLBACK:
-- DROP POLICY IF EXISTS "members_select_own" ON members;
-- DROP POLICY IF EXISTS "members_select_approved_or_admin" ON members;
-- DROP FUNCTION IF EXISTS get_my_member_status();
-- CREATE POLICY "approved_members_or_admins_can_view"
--   ON members FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM members m
--       WHERE m.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
--         AND m.approved = true
--     )
--     OR
--     EXISTS (
--       SELECT 1 FROM admins a
--       WHERE a.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
--     )
--   );

COMMIT;
