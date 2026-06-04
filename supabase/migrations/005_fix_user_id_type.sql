-- 005_fix_user_id_type.sql
-- members.user_id 타입을 uuid → text로 변경하고
-- 기존 데이터를 GitHub 숫자 ID로 업데이트

-- user_id 컬럼이 uuid 타입인 경우 text로 변경
ALTER TABLE members
  ALTER COLUMN user_id TYPE text
  USING user_id::text;

-- 기존 장학성 행: UUID → GitHub 숫자 ID로 업데이트
UPDATE members
SET user_id = '6677919'
WHERE user_id = '283abc65-c788-4118-a0aa-738497791794';
