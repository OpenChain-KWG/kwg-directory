-- KWG 가입 정책 반영: 신규 컬럼 추가
-- contact_email: 메일링리스트 초대장 수신 이메일 (기존 email과 별도)
-- subscribe_mailing_list: groups.io 가입 신청 여부
-- privacy_agreed_at: 개인정보처리방침 동의 일시
-- rejection_reason: 운영진 거절 사유 (어드민 기록용)

BEGIN;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS subscribe_mailing_list boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ROLLBACK:
-- ALTER TABLE members
--   DROP COLUMN IF EXISTS contact_email,
--   DROP COLUMN IF EXISTS subscribe_mailing_list,
--   DROP COLUMN IF EXISTS privacy_agreed_at,
--   DROP COLUMN IF EXISTS rejection_reason;

COMMIT;
