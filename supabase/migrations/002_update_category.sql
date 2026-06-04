-- 멤버 분류 체계 변경: 4종 → 3종 (기업 / 연구·공공 / 학계)

ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_category_check;

ALTER TABLE members
  ADD CONSTRAINT members_category_check
  CHECK (category IN ('기업', '연구/공공', '학계'));

-- 기존 데이터 마이그레이션
UPDATE members SET category = '기업'
  WHERE category IN ('대기업', '중견/중소', '스타트업');
