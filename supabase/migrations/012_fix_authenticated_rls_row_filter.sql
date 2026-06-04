-- 인증 사용자 RLS 행 필터 수정
-- 이유: 011에서 도입한 members_select_approved_or_admin 정책이
--       get_my_member_status()='approved' 조건으로 뷰어 승인 여부만 체크하고
--       조회되는 행의 approved 상태를 필터링하지 않아
--       승인된 멤버가 미승인 멤버 행까지 조회할 수 있는 문제 수정.
-- 수정: members_select_approved_or_admin 정책에 approved = true 행 필터 추가.
-- 주의: 012에서 approved_members_or_admins_can_view를 재생성하면 011의 수정이 무효화되므로
--       011 구조(members_select_own + members_select_approved_or_admin)를 유지.

BEGIN;

-- 기존 정책 삭제 후 행 필터 추가하여 재생성
DROP POLICY IF EXISTS "members_select_approved_or_admin" ON members;

-- 승인된 멤버는 approved=true 행만, 관리자는 전체 조회 가능
CREATE POLICY "members_select_approved_or_admin"
  ON members FOR SELECT
  TO authenticated
  USING (
    -- 관리자는 모든 행 조회 가능
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
    OR
    -- 승인된 멤버는 approved=true 행만 조회 가능
    (
      approved = true
      AND get_my_member_status() = 'approved'
    )
  );

-- ROLLBACK:
-- DROP POLICY IF EXISTS "members_select_approved_or_admin" ON members;
-- CREATE POLICY "members_select_approved_or_admin"
--   ON members FOR SELECT
--   TO authenticated
--   USING (
--     get_my_member_status() = 'approved'
--     OR EXISTS (
--       SELECT 1 FROM admins a
--       WHERE a.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
--     )
--   );

COMMIT;
