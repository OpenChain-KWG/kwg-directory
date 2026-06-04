-- 성능 최적화 인덱스 (1,000명 안정 운영 대응)
-- approved 컬럼 기반 주요 쿼리 최적화

BEGIN;

-- 1. 멤버 목록 조회 최적화 (approved=true 필터 + name_ko 정렬)
CREATE INDEX IF NOT EXISTS idx_members_approved_name_ko
  ON members(approved, name_ko) WHERE approved = true;

-- 2. 관리자 대기 목록 최적화 (approved=false AND rejection_reason IS NULL)
CREATE INDEX IF NOT EXISTS idx_members_pending
  ON members(approved, rejection_reason)
  WHERE approved = false AND rejection_reason IS NULL;

-- 3. user_id 조회 최적화 (프로필 확인, 중복 등록 방지)
CREATE INDEX IF NOT EXISTS idx_members_user_id
  ON members(user_id);

-- 4. 메일링리스트 초대 현황 조회 최적화
CREATE INDEX IF NOT EXISTS idx_members_mailing_invite
  ON members(mailing_invite_sent_at)
  WHERE subscribe_mailing_list = true;

-- 5. 전체 멤버 수 빠른 카운트 (approved 단독 인덱스)
CREATE INDEX IF NOT EXISTS idx_members_approved
  ON members(approved);

-- ROLLBACK:
-- DROP INDEX IF EXISTS idx_members_approved_name_ko;
-- DROP INDEX IF EXISTS idx_members_pending;
-- DROP INDEX IF EXISTS idx_members_user_id;
-- DROP INDEX IF EXISTS idx_members_mailing_invite;
-- DROP INDEX IF EXISTS idx_members_approved;

COMMIT;
