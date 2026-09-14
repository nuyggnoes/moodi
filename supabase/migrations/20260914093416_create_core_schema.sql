-- Moodi 핵심 스키마: mood enum + users/records/follows/likes + RLS
-- 참고: docs/spec.md "DB 테이블 구조", docs/adr/0004-database-supabase.md

create type mood_type as enum ('exciting', 'calm', 'energetic', 'sad', 'focused');

-- users: auth.users 1:1, 프로필 정보
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- records: 음악 기록
create table public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  track_id text not null,
  track_name text not null,
  artist text not null,
  album_art text,
  preview_url text,
  mood mood_type not null,
  mood_source text not null default 'user' check (mood_source in ('user', 'ai')),
  memo text,
  ai_comment text,
  created_at timestamptz not null default now()
);

-- 캘린더 range query(/diary)와 피드 정렬(/) 용 인덱스
create index records_user_id_created_at_idx on public.records (user_id, created_at desc);
create index records_created_at_idx on public.records (created_at desc);

-- follows: 단방향 팔로우 그래프
create table public.follows (
  follower_id uuid not null references public.users (id) on delete cascade,
  following_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

-- likes
create table public.likes (
  user_id uuid not null references public.users (id) on delete cascade,
  record_id uuid not null references public.records (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, record_id)
);

create index likes_record_id_idx on public.likes (record_id);

-- RLS: 공개 읽기, 쓰기는 소유자만 (docs/adr/0004 참고)
alter table public.users enable row level security;
alter table public.records enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;

create policy users_select_public on public.users
  for select using (true);
create policy users_insert_own on public.users
  for insert with check (auth.uid() = id);
create policy users_update_own on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy records_select_public on public.records
  for select using (true);
create policy records_insert_own on public.records
  for insert with check (auth.uid() = user_id);
create policy records_update_own on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy records_delete_own on public.records
  for delete using (auth.uid() = user_id);

create policy follows_select_public on public.follows
  for select using (true);
create policy follows_insert_own on public.follows
  for insert with check (auth.uid() = follower_id);
create policy follows_delete_own on public.follows
  for delete using (auth.uid() = follower_id);

create policy likes_select_public on public.likes
  for select using (true);
create policy likes_insert_own on public.likes
  for insert with check (auth.uid() = user_id);
create policy likes_delete_own on public.likes
  for delete using (auth.uid() = user_id);
