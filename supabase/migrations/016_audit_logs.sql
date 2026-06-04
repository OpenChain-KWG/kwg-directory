-- ============================================================
-- Migration 016: audit_logs 테이블
-- 목적: 어드민 액션(승인/거절/재발송/관리자 추가·제거) 감사 로그
-- append-only 설계: INSERT만 허용, UPDATE/DELETE 차단
-- ============================================================
-- ROLLBACK:
--   DROP TABLE IF EXISTS audit_logs;

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  -- actor_id/target_id는 text: 이 앱은 Supabase Auth가 아니라 NextAuth(GitHub 숫자 ID)를
  -- 식별자로 쓴다(admins.user_id, members.user_id도 text). uuid + auth.users FK로 두면
  -- 모든 insert가 타입 오류로 실패한다.
  actor_id    text,
  action      text          NOT NULL,
  target_type text          NOT NULL,
  target_id   text,
  before      jsonb,
  after       jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx
  ON audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_target_idx
  ON audit_logs (target_type, target_id);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON audit_logs (action);

-- RLS 활성화
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 어드민만 조회 가능.
-- admins.user_id(text, GitHub ID)와 auth.uid()(uuid)는 타입이 달라 캐스팅 필요.
-- 실제 조회는 API Route가 service_role(createAdminClient)로 수행해 RLS를 bypass하며,
-- 본 정책은 anon/authenticated의 직접 접근을 막는 안전 기본값으로 작동한다.
CREATE POLICY "admin_read_audit_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()::text
    )
  );

-- INSERT: service_role 전용 (RLS bypass) → 정책 없이 일반 역할 차단
-- service_role은 RLS를 bypass하므로 별도 정책 불필요.
-- 아래 정책은 authenticated가 직접 INSERT하는 경로를 명시적으로 차단.
CREATE POLICY "deny_direct_insert_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (false);

-- UPDATE: 완전 차단 (append-only)
CREATE POLICY "deny_update_audit_logs"
  ON audit_logs FOR UPDATE
  USING (false);

-- DELETE: 완전 차단 (append-only)
CREATE POLICY "deny_delete_audit_logs"
  ON audit_logs FOR DELETE
  USING (false);

COMMIT;
