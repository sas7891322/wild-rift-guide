-- Wild Rift Guide v91｜找隊友正式版資料庫
-- 可重複執行，不會刪除既有會員、收藏或瀏覽紀錄。

begin;

create extension if not exists "pgcrypto";

create table if not exists public.player_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  riot_id text not null,
  server text not null,
  rank text not null,
  primary_role text not null,
  secondary_role text,
  wanted_roles text[] not null default array[]::text[],
  mode text not null,
  online_time text not null,
  voice text not null default 'either',
  contact text,
  note text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  constraint player_posts_one_per_user unique (user_id),
  constraint player_posts_display_name_length check (char_length(btrim(display_name)) between 1 and 20),
  constraint player_posts_riot_id_length check (char_length(btrim(riot_id)) between 3 and 36),
  constraint player_posts_server_valid check (server in ('tw','sea','jp','kr','other')),
  constraint player_posts_rank_valid check (rank in ('unranked','iron','bronze','silver','gold','platinum','emerald','diamond','master','grandmaster','challenger')),
  constraint player_posts_primary_role_valid check (primary_role in ('baron','jungle','mid','duo','support','fill')),
  constraint player_posts_secondary_role_valid check (secondary_role is null or secondary_role in ('baron','jungle','mid','duo','support','fill')),
  constraint player_posts_roles_different check (secondary_role is null or secondary_role <> primary_role),
  constraint player_posts_wanted_roles_count check (cardinality(wanted_roles) between 1 and 6),
  constraint player_posts_wanted_roles_valid check (wanted_roles <@ array['baron','jungle','mid','duo','support','fill']::text[]),
  constraint player_posts_mode_valid check (mode in ('duoRank','rankTeam','normal','aram','newbie')),
  constraint player_posts_online_time_valid check (online_time in ('morning','afternoon','evening','late','weekend','flexible')),
  constraint player_posts_voice_valid check (voice in ('yes','no','either')),
  constraint player_posts_contact_length check (contact is null or char_length(contact) <= 40),
  constraint player_posts_note_length check (char_length(btrim(note)) between 1 and 120),
  constraint player_posts_status_valid check (status in ('active','hidden')),
  constraint player_posts_expiry_valid check (expires_at > created_at)
);

create table if not exists public.player_reports (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.player_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  detail text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolution text,
  constraint player_reports_once unique (post_id, reporter_id),
  constraint player_reports_reason_valid check (reason in ('abuse','spam','scam','personal','other')),
  constraint player_reports_detail_length check (detail is null or char_length(detail) <= 120),
  constraint player_reports_resolution_valid check (resolution is null or resolution in ('dismissed','post_hidden','user_warned'))
);

create index if not exists player_posts_public_feed_idx
  on public.player_posts (status, expires_at desc, updated_at desc);
create index if not exists player_posts_server_rank_idx
  on public.player_posts (server, rank);
create index if not exists player_posts_primary_role_idx
  on public.player_posts (primary_role);
create index if not exists player_posts_wanted_roles_idx
  on public.player_posts using gin (wanted_roles);
create index if not exists player_reports_review_idx
  on public.player_reports (reviewed_at, created_at desc);

create or replace function public.set_player_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_posts_set_updated_at on public.player_posts;
create trigger player_posts_set_updated_at
before update on public.player_posts
for each row execute function public.set_player_post_updated_at();

alter table public.player_posts enable row level security;
alter table public.player_reports enable row level security;

drop policy if exists "player_posts_read_public_or_own" on public.player_posts;
create policy "player_posts_read_public_or_own"
on public.player_posts for select
to anon, authenticated
using (
  (status = 'active' and expires_at > now())
  or (select auth.uid()) = user_id
);

drop policy if exists "player_posts_insert_own" on public.player_posts;
create policy "player_posts_insert_own"
on public.player_posts for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "player_posts_update_own" on public.player_posts;
create policy "player_posts_update_own"
on public.player_posts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "player_posts_delete_own" on public.player_posts;
create policy "player_posts_delete_own"
on public.player_posts for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "player_reports_read_own" on public.player_reports;
create policy "player_reports_read_own"
on public.player_reports for select
to authenticated
using ((select auth.uid()) = reporter_id);

drop policy if exists "player_reports_insert_own" on public.player_reports;
create policy "player_reports_insert_own"
on public.player_reports for insert
to authenticated
with check (
  (select auth.uid()) = reporter_id
  and exists (
    select 1 from public.player_posts post
    where post.id = post_id
      and post.user_id <> (select auth.uid())
  )
);

revoke all on table public.player_posts from anon, authenticated;
revoke all on table public.player_reports from anon, authenticated;

grant select on table public.player_posts to anon;
grant select, insert, update, delete on table public.player_posts to authenticated;
grant select, insert on table public.player_reports to authenticated;
grant usage, select on sequence public.player_reports_id_seq to authenticated;

revoke execute on function public.set_player_post_updated_at() from public, anon, authenticated;

commit;

-- 安裝完成後可在 SQL Editor 執行以下驗證：
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename in ('player_posts','player_reports');
