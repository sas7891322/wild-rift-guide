-- ============================================================================
-- Wild Rift Guide v79.1｜正式會員系統
-- Supabase Auth + profiles + favorite_heroes + recent_hero_views + RLS
--
-- 使用方式：Supabase Dashboard → SQL Editor → New query → 貼上整份 → Run
-- 可安全重複執行。請勿在任何前端檔案使用 Secret / service_role key。
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. 資料表
-- --------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_heroes (
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, hero_id)
);

create table if not exists public.recent_hero_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  guide_id text not null,
  hero_id text not null,
  role_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, guide_id)
);

-- 舊版資料庫升級時補齊欄位。
alter table public.profiles
  add column if not exists nickname text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.favorite_heroes
  add column if not exists hero_id text,
  add column if not exists created_at timestamptz not null default now();

alter table public.recent_hero_views
  add column if not exists guide_id text,
  add column if not exists hero_id text,
  add column if not exists role_id text,
  add column if not exists viewed_at timestamptz not null default now();

-- 命名限制與資料格式檢查；使用 DO 區塊避免重複執行時報錯。
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_nickname_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_nickname_format_check
      check (
        nickname = btrim(nickname)
        and char_length(nickname) between 2 and 20
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'favorite_heroes_hero_id_check'
      and conrelid = 'public.favorite_heroes'::regclass
  ) then
    alter table public.favorite_heroes
      add constraint favorite_heroes_hero_id_check
      check (char_length(hero_id) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recent_hero_views_guide_id_check'
      and conrelid = 'public.recent_hero_views'::regclass
  ) then
    alter table public.recent_hero_views
      add constraint recent_hero_views_guide_id_check
      check (char_length(guide_id) between 1 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recent_hero_views_hero_id_check'
      and conrelid = 'public.recent_hero_views'::regclass
  ) then
    alter table public.recent_hero_views
      add constraint recent_hero_views_hero_id_check
      check (char_length(hero_id) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recent_hero_views_role_id_check'
      and conrelid = 'public.recent_hero_views'::regclass
  ) then
    alter table public.recent_hero_views
      add constraint recent_hero_views_role_id_check
      check (role_id in ('baron', 'jungle', 'mid', 'duo', 'support'));
  end if;
end
$$;

create index if not exists recent_hero_views_user_viewed_idx
  on public.recent_hero_views (user_id, viewed_at desc);

comment on table public.profiles is 'Wild Rift Guide 會員公開顯示資料；v79 僅允許本人讀取。';
comment on table public.favorite_heroes is '會員收藏的英雄，跨路線共用同一英雄收藏狀態。';
comment on table public.recent_hero_views is '會員最近查看的英雄位置攻略。';

-- --------------------------------------------------------------------------
-- 2. 通用函式與 Trigger
-- --------------------------------------------------------------------------

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_current_timestamp_updated_at() from public;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_current_timestamp_updated_at();

create or replace function public.member_default_nickname(email_value text, metadata jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when char_length(candidate) < 2 then rpad(candidate, 2, '_')
    else candidate
  end
  from (
    select left(
      btrim(
        coalesce(
          nullif(btrim(metadata ->> 'nickname'), ''),
          nullif(split_part(coalesce(email_value, ''), '@', 1), ''),
          '會員'
        )
      ),
      20
    ) as candidate
  ) source;
$$;

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    public.member_default_nickname(new.email, new.raw_user_meta_data)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.member_default_nickname(text, jsonb) from public;
revoke all on function public.handle_new_member() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_member();

-- 補建執行 SQL 前已存在的 Auth 使用者資料。
insert into public.profiles (id, nickname, created_at, updated_at)
select
  users.id,
  public.member_default_nickname(users.email, users.raw_user_meta_data),
  coalesce(users.created_at, now()),
  now()
from auth.users as users
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- 3. Row Level Security
-- --------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.favorite_heroes enable row level security;
alter table public.recent_hero_views enable row level security;

-- 匿名使用者沒有會員資料表權限。
revoke all on table public.profiles from anon;
revoke all on table public.favorite_heroes from anon;
revoke all on table public.recent_hero_views from anon;

-- 最小權限：會員只能操作功能實際需要的欄位與動作。
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (nickname) on table public.profiles to authenticated;

revoke all on table public.favorite_heroes from authenticated;
grant select, insert, delete on table public.favorite_heroes to authenticated;

revoke all on table public.recent_hero_views from authenticated;
grant select, insert, update, delete on table public.recent_hero_views to authenticated;

-- Supabase 內部後端角色保留完整權限；此角色的 Key 不可放進前端。
grant all on table public.profiles to service_role;
grant all on table public.favorite_heroes to service_role;
grant all on table public.recent_hero_views to service_role;

-- 清除舊 Policy，確保重跑後規則一致。
drop policy if exists "Members can read their own profile" on public.profiles;
drop policy if exists "Members can update their own profile" on public.profiles;
drop policy if exists "Members can read their own favorites" on public.favorite_heroes;
drop policy if exists "Members can add their own favorites" on public.favorite_heroes;
drop policy if exists "Members can remove their own favorites" on public.favorite_heroes;
drop policy if exists "Members can read their own recent views" on public.recent_hero_views;
drop policy if exists "Members can add their own recent views" on public.recent_hero_views;
drop policy if exists "Members can update their own recent views" on public.recent_hero_views;
drop policy if exists "Members can remove their own recent views" on public.recent_hero_views;

create policy "Members can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "Members can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "Members can read their own favorites"
on public.favorite_heroes for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can add their own favorites"
on public.favorite_heroes for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can remove their own favorites"
on public.favorite_heroes for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can read their own recent views"
on public.recent_hero_views for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can add their own recent views"
on public.recent_hero_views for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can update their own recent views"
on public.recent_hero_views for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Members can remove their own recent views"
on public.recent_hero_views for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

commit;

-- 完成後，Results 若顯示 Success / No rows returned，即代表腳本已執行。
