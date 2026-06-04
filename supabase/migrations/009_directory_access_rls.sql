-- 디렉토리 조회 권한 제한
-- 이유: 승인된 멤버 또는 관리자만 멤버 목록을 조회할 수 있도록 정책 강화.
--       기존 authenticated_read_approved 정책은 로그인한 모든 사용자를 허용했으나
--       이제는 해당 사용자 자신이 approved=true 이거나 admins 테이블에 존재해야 함.
-- 주의: 실제 API는 service_role을 사용하므로 RLS를 우회함.
--       이 정책은 Supabase 클라이언트 직접 접근에 대한 방어 계층임.

BEGIN;

-- 기존 인증 사용자 전체 허용 정책 제거
DROP POLICY IF EXISTS "authenticated_read_approved" ON members;

-- 승인된 멤버 또는 관리자만 디렉토리 조회 허용
-- (NextAuth JWT 사용 환경에서는 실질적으로 service_role API가 이 정책을 우회하며,
--  page.tsx 서버 컴포넌트 레벨에서 권한 분기를 처리함)
CREATE POLICY "approved_members_or_admins_can_view"
  ON members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
        AND m.approved = true
    )
    OR
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
  );

-- ROLLBACK:
-- DROP POLICY IF EXISTS "approved_members_or_admins_can_view" ON members;
-- CREATE POLICY "authenticated_read_approved"
--   ON members FOR SELECT
--   TO authenticated
--   USING (approved = true);

COMMIT;
