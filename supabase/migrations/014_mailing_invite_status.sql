-- groups.io 메일링리스트 초대 발송 상태 추적 컬럼 추가
-- mailing_invite_sent_at: 초대 발송 성공 일시 (null = 미발송 또는 실패)
-- mailing_invite_error: 초대 실패 사유 (null = 성공 또는 미시도)

BEGIN;

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS mailing_invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS mailing_invite_error text;

-- ROLLBACK:
-- ALTER TABLE members
--   DROP COLUMN IF EXISTS mailing_invite_sent_at,
--   DROP COLUMN IF EXISTS mailing_invite_error;

COMMIT;
