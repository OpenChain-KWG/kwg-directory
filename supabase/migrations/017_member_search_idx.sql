-- 변경 이유: /api/members/search 엔드포인트 trigram 검색 지원을 위한 GIN 인덱스 추가
-- name_ko, name_en, company 컬럼에 ilike 검색 성능 개선

BEGIN;

-- pg_trgm extension 활성화 (이미 있으면 skip)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- name_ko GIN trigram 인덱스
CREATE INDEX IF NOT EXISTS members_name_ko_trgm_idx
  ON members USING gin (name_ko gin_trgm_ops);

-- name_en GIN trigram 인덱스 (NULL-safe: 값 있는 행만 인덱스)
CREATE INDEX IF NOT EXISTS members_name_en_trgm_idx
  ON members USING gin (name_en gin_trgm_ops)
  WHERE name_en IS NOT NULL;

-- company GIN trigram 인덱스
CREATE INDEX IF NOT EXISTS members_company_trgm_idx
  ON members USING gin (company gin_trgm_ops);

COMMIT;

-- ROLLBACK:
-- DROP INDEX IF EXISTS members_name_ko_trgm_idx;
-- DROP INDEX IF EXISTS members_name_en_trgm_idx;
-- DROP INDEX IF EXISTS members_company_trgm_idx;
-- DROP EXTENSION IF EXISTS pg_trgm;
