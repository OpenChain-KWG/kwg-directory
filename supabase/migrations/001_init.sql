-- KWG Directory 초기 스키마
-- next-auth v5 JWT 세션 방식 사용 (Supabase Auth 미사용)
-- user_id: GitHub OAuth provider 사용자 ID (text)

-- Members 테이블
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null unique,  -- next-auth session user ID (GitHub numeric ID)
  name_ko       text not null,
  name_en       text,
  company       text not null,
  role          text,
  bio           text,
  category      text check (category in ('대기업', '중견/중소', '연구/공공', '스타트업')),
  email         text,
  email_public  boolean default false,
  linkedin      text,
  github        text,
  discord       text,
  blog          text,
  avatar_url    text,
  approved      boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Admins 테이블 (운영진 권한)
create table if not exists admins (
  user_id  text primary key,  -- GitHub user ID
  added_at timestamptz default now()
);

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at
  before update on members
  for each row execute function update_updated_at();

-- RLS 활성화
alter table members enable row level security;
alter table admins enable row level security;

-- RLS 정책: 승인된 멤버만 공개 조회 허용 (email 컬럼은 API Route에서 필터링)
create policy "public_read_approved"
  on members for select
  to anon
  using (approved = true);

-- 인증 사용자는 email 포함 모든 컬럼 조회 가능
create policy "authenticated_read_approved"
  on members for select
  to authenticated
  using (approved = true);

-- admins 테이블은 공개 읽기 금지 (서비스 롤만 접근)
create policy "admins_no_public_read"
  on admins for select
  to anon
  using (false);

-- 서비스 롤(API Route)은 RLS 우회 → 별도 정책 불필요
-- INSERT / UPDATE / DELETE 는 모두 서비스 롤을 통해서만 허용
