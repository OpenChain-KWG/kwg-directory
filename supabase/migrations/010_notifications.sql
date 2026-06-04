-- 관리자 알림 테이블
-- 이유: 이메일 전송 환경(RESEND_API_KEY)이 없으므로 DB 알림 방식으로 대체.
--       신규 멤버 등록 시 notifications 테이블에 INSERT하여 관리자 페이지에 배지 표시.

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text NOT NULL,      -- 'new_member_registration'
  payload    jsonb,              -- { name_ko, company, user_id }
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화 (서비스 롤만 접근)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- anon / authenticated 직접 접근 차단
CREATE POLICY "notifications_no_public_access"
  ON notifications FOR ALL
  TO anon, authenticated
  USING (false);

-- ROLLBACK:
-- DROP TABLE IF EXISTS notifications;

COMMIT;
