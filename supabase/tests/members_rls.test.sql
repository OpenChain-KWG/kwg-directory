-- KWG Directory — RLS 정책 테스트 (pgTAP)
-- 실행: supabase test db
-- 참고: 이 프로젝트는 next-auth JWT 세션을 사용하므로 Supabase Auth(auth.uid())는
--       사용하지 않는다. 모든 멤버 조회/쓰기는 service_role(API Route)을 통한다.
--       anon(공개 키) 직접 접근은 전면 차단되어야 한다 (019 — PII 유출 차단).

begin;
select plan(8);

-- ── 테스트 데이터 준비 (service_role, RLS 우회) ──────────────────────────────
insert into members (id, user_id, name_ko, company, email, email_public, approved)
values
  ('00000000-0000-0000-0000-000000000001', 'github-test-001', '승인멤버', '테스트기업', 'approved@test.com', true, true),
  ('00000000-0000-0000-0000-000000000002', 'github-test-002', '미승인멤버', '테스트기업', 'pending@test.com', false, false);

-- ── 1. service_role(기본): 직접 조회 가능 (앱 경로) ─────────────────────────
select is(
  (select count(*) from members),
  2::bigint,
  'service_role은 members를 직접 조회할 수 있다 (앱은 이 경로만 사용)'
);

-- ── 2. anon: members SELECT 전면 차단 (PII 유출 방지) ────────────────────────
-- throws_ok(sql, errcode, errmsg, description): errmsg=NULL → SQLSTATE만 검사
set role anon;
select throws_ok(
  $$ select count(*) from members $$,
  '42501', NULL,
  'anon은 members를 직접 조회할 수 없다 (email/phone PII 유출 차단)'
);

-- ── 3. anon: 승인 멤버의 email 컬럼도 직접 조회 불가 ─────────────────────────
select throws_ok(
  $$ select email from members where approved = true $$,
  '42501', NULL,
  'anon은 approved 멤버의 email 컬럼도 직접 조회할 수 없다'
);

-- ── 4. anon: INSERT 불가 ────────────────────────────────────────────────────
select throws_ok(
  $$ insert into members (user_id, name_ko, company, email_public, approved)
     values ('github-anon', '무단삽입', '테스트', false, false) $$,
  '42501'
);

-- ── 5. anon: UPDATE 불가 ────────────────────────────────────────────────────
select throws_ok(
  $$ update members set name_ko = '수정시도' where id = '00000000-0000-0000-0000-000000000001' $$,
  '42501'
);

-- ── 6. anon: DELETE 불가 ────────────────────────────────────────────────────
select throws_ok(
  $$ delete from members where id = '00000000-0000-0000-0000-000000000001' $$,
  '42501'
);

-- ── 7. anon: admins 행 조회 불가 (RLS using(false) → 0행) ────────────────────
-- admins는 SELECT 권한은 있으나 RLS 정책으로 행이 전부 필터됨(예외 아님, 0행).
reset role;
set role anon;
select is(
  (select count(*) from admins),
  0::bigint,
  'anon은 admins 행을 조회할 수 없다 (RLS로 0행)'
);

-- ── 8. authenticated: 직접 쓰기 불가 (service_role API만 허용) ───────────────
reset role;
set role authenticated;
select throws_ok(
  $$ insert into members (user_id, name_ko, company, email_public, approved)
     values ('github-auth', '무단삽입', '테스트', false, true) $$,
  '42501'
);

-- ── 정리 ────────────────────────────────────────────────────────────────────
reset role;
select * from finish();
rollback;
