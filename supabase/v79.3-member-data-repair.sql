-- Wild Rift Guide v79.3｜會員資料同步修復（必要時才執行）
-- 功能：補齊欄位、唯一索引、RLS 與 authenticated 權限。
-- 不會刪除會員帳號；可重複執行。

begin;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists nickname text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.favorite_heroes
  add column if not exists created_at timestamptz default now();

alter table public.recent_hero_views
  add column if not exists guide_id text,
  add column if not exists role_id text,
  add column if not exists viewed_at timestamptz default now();

update public.favorite_heroes set created_at = now() where created_at is null;
update public.recent_hero_views set viewed_at = now() where viewed_at is null;

-- 同一會員／英雄只保留一筆最近紀錄。
delete from public.recent_hero_views older
using public.recent_hero_views newer
where older.user_id = newer.user_id
  and older.hero_id = newer.hero_id
  and (
    older.viewed_at < newer.viewed_at
    or (older.viewed_at = newer.viewed_at and older.ctid < newer.ctid)
  );

create unique index if not exists favorite_heroes_user_hero_unique
  on public.favorite_heroes (user_id, hero_id);
create unique index if not exists recent_hero_views_user_hero_unique
  on public.recent_hero_views (user_id, hero_id);

alter table public.profiles enable row level security;
alter table public.favorite_heroes enable row level security;
alter table public.recent_hero_views enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "favorite_heroes_select_own" on public.favorite_heroes;
create policy "favorite_heroes_select_own" on public.favorite_heroes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "favorite_heroes_insert_own" on public.favorite_heroes;
create policy "favorite_heroes_insert_own" on public.favorite_heroes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "favorite_heroes_delete_own" on public.favorite_heroes;
create policy "favorite_heroes_delete_own" on public.favorite_heroes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_select_own" on public.recent_hero_views;
create policy "recent_hero_views_select_own" on public.recent_hero_views for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_insert_own" on public.recent_hero_views;
create policy "recent_hero_views_insert_own" on public.recent_hero_views for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_update_own" on public.recent_hero_views;
create policy "recent_hero_views_update_own" on public.recent_hero_views for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "recent_hero_views_delete_own" on public.recent_hero_views;
create policy "recent_hero_views_delete_own" on public.recent_hero_views for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, delete on table public.favorite_heroes to authenticated;
grant select, insert, update, delete on table public.recent_hero_views to authenticated;

commit;
