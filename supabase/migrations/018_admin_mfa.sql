-- ============================================================
-- Migration 018: admins 테이블 MFA 검증 컬럼 추가
-- 목적: GitHub MFA 활성화 검증 시각 기록 (admin 강제 MFA 정책 지원)
-- ADMIN_MFA_REQUIRED=on 환경변수로 활성화
-- ============================================================
-- ROLLBACK:
--   ALTER TABLE admins DROP COLUMN IF EXISTS mfa_verified_at;

BEGIN;

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz;

COMMENT ON COLUMN admins.mfa_verified_at IS
  'GitHub MFA 활성화가 확인된 시각. NULL이면 미검증. ADMIN_MFA_REQUIRED=on 시 admin 액세스 거부.';

COMMIT;
