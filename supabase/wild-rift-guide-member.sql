-- Wild Rift Guide v79 - Supabase 會員系統正式安裝腳本
-- 適用於已建立或尚未建立 profiles / favorite_heroes / recent_hero_views 的專案
-- 可重複執行；不會刪除既有會員資料。

begin;

create extension if not exists "pgcrypto";

-- 1. 會員資料表
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;

alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();

-- 使用者名稱不分英文大小寫，避免 Xinqi 與 xinqi 重複。
create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null and btrim(username) <> '';

-- 2. 收藏英雄資料表
create table if not exists public.favorite_heroes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hero_id text not null,
  created_at timestamptz default now(),
  constraint favorite_hero_unique unique (user_id, hero_id)
);

alter table public.favorite_heroes
  add column if not exists id bigint generated always as identity,
  add column if not exists user_id uuid,
  add column if not exists hero_id text,
  add column if not exists created_at timestamptz default now();


-- 舊版資料表可能已存在但缺少 id；若目前沒有主鍵，補上 id 主鍵。
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.favorite_heroes'::regclass
      and contype = 'p'
  ) then
    alter table public.favorite_heroes
      add constraint favorite_heroes_pkey primary key (id);
  end if;
end
$$;

update public.favorite_heroes set created_at = now() where created_at is null;
alter table public.favorite_heroes alter column created_at set default now();

create unique index if not exists favorite_heroes_user_hero_unique
  on public.favorite_heroes (user_id, hero_id);

create index if not exists favorite_heroes_user_created_idx
  on public.favorite_heroes (user_id, created_at desc);

-- 3. 最近瀏覽資料表
-- 每位會員每位英雄只保留一筆，重複瀏覽時由前端 upsert 更新 viewed_at。
create table if not exists public.recent_hero_views (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hero_id text not null,
  viewed_at timestamptz default now()
);

alter table public.recent_hero_views
  add column if not exists id bigint generated always as identity,
  add column if not exists user_id uuid,
  add column if not exists hero_id text,
  add column if not exists viewed_at timestamptz default now();


-- 舊版資料表可能已存在但缺少 id；若目前沒有主鍵，補上 id 主鍵。
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recent_hero_views'::regclass
      and contype = 'p'
  ) then
    alter table public.recent_hero_views
      add constraint recent_hero_views_pkey primary key (id);
  end if;
end
$$;

update public.recent_hero_views set viewed_at = now() where viewed_at is null;
alter table public.recent_hero_views alter column viewed_at set default now();

-- 若之前曾產生重複紀錄，只保留最新一筆。
delete from public.recent_hero_views older
using public.recent_hero_views newer
where older.user_id = newer.user_id
  and older.hero_id = newer.hero_id
  and (
    older.viewed_at < newer.viewed_at
    or (older.viewed_at = newer.viewed_at and older.id < newer.id)
  );

create unique index if not exists recent_hero_views_user_hero_unique
  on public.recent_hero_views (user_id, hero_id);

create index if not exists recent_hero_views_user_time_idx
  on public.recent_hero_views (user_id, viewed_at desc);

-- 4. updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 5. Auth 註冊完成後，自動建立 profiles
-- username 保持空白，避免註冊時因名稱重複導致 Auth 建立失敗。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    null,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '玩家'
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 補齊在安裝 Trigger 前就已存在的 Auth 使用者。
insert into public.profiles (id, username, display_name, avatar_url, created_at, updated_at)
select
  u.id,
  null,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'nickname'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    '玩家'
  ),
  nullif(btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do nothing;

-- 6. RLS
alter table public.profiles enable row level security;
alter table public.favorite_heroes enable row level security;
alter table public.recent_hero_views enable row level security;

-- profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- favorite_heroes policies
drop policy if exists "favorite_heroes_select_own" on public.favorite_heroes;
create policy "favorite_heroes_select_own"
on public.favorite_heroes for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "favorite_heroes_insert_own" on public.favorite_heroes;
create policy "favorite_heroes_insert_own"
on public.favorite_heroes for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_heroes_delete_own" on public.favorite_heroes;
create policy "favorite_heroes_delete_own"
on public.favorite_heroes for delete
to authenticated
using ((select auth.uid()) = user_id);

-- recent_hero_views policies
drop policy if exists "recent_hero_views_select_own" on public.recent_hero_views;
create policy "recent_hero_views_select_own"
on public.recent_hero_views for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_insert_own" on public.recent_hero_views;
create policy "recent_hero_views_insert_own"
on public.recent_hero_views for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_update_own" on public.recent_hero_views;
create policy "recent_hero_views_update_own"
on public.recent_hero_views for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_delete_own" on public.recent_hero_views;
create policy "recent_hero_views_delete_own"
on public.recent_hero_views for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 7. API 權限：未登入者無法讀取會員資料；登入者仍受 RLS 限制。
revoke all on table public.profiles from anon;
revoke all on table public.favorite_heroes from anon;
revoke all on table public.recent_hero_views from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, delete on table public.favorite_heroes to authenticated;
grant select, insert, update, delete on table public.recent_hero_views to authenticated;

-- Identity 欄位需要的 sequence 權限。
grant usage, select on sequence public.favorite_heroes_id_seq to authenticated;
grant usage, select on sequence public.recent_hero_views_id_seq to authenticated;

-- Trigger 函式不開放給瀏覽器直接呼叫。
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

commit;
