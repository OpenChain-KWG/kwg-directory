-- ============================================================
-- Migration 019: members 직접 조회를 service_role 전용으로 잠금 (PII 유출 차단)
-- ============================================================
-- 발견 (L3 RLS 보안 감사, 2026-05-22):
--   001의 "public_read_approved" 정책이 한 번도 제거되지 않아, 공개 anon 키
--   (NEXT_PUBLIC_SUPABASE_ANON_KEY)로 Supabase REST에 직접 접근하면 approved 멤버의
--   모든 컬럼(email, phone, contact_email 등 PII 포함)을 조회할 수 있었다.
--   API Route 레벨의 email 필터링은 이 직접 경로를 막지 못한다.
--
-- 정책 결정:
--   디렉토리는 로그인 필수(private, robots noindex)이며, 앱은 모든 멤버 조회를
--   service_role(createAdminClient)로만 수행한다(anon 클라이언트 미사용). 따라서
--   anon의 members 직접 SELECT를 전면 차단한다. service_role은 RLS·권한을 우회하므로
--   앱 동작에는 영향이 없다.
--
-- 참고: authenticated 롤의 SELECT 정책(members_select_own / _approved_or_admin)은
--   Supabase Auth JWT(sub) 기반인데 이 앱은 NextAuth를 쓰므로 실질적으로 도달 불가
--   (dead). 무해하므로 유지하되, 공개 노출의 핵심인 anon 경로만 잠근다.
-- ============================================================
-- ROLLBACK:
--   GRANT SELECT ON members TO anon;
--   CREATE POLICY "public_read_approved" ON members FOR SELECT TO anon USING (approved = true);

BEGIN;

-- anon 직접 조회 정책 제거
DROP POLICY IF EXISTS "public_read_approved" ON members;

-- anon 테이블 SELECT 권한 회수 → 정책 유무와 무관하게 42501 permission denied
REVOKE SELECT ON members FROM anon;

COMMIT;
