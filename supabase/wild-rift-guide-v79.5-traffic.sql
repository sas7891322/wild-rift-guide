-- Wild Rift Guide v79.5｜網站瀏覽與在線人數
-- 執行位置：Supabase Dashboard -> SQL Editor -> New query -> Run
-- 功能：
-- 1. 記錄全站累積頁面瀏覽次數。
-- 2. 以匿名瀏覽器 session_id 計算最近 2 分鐘仍有活動的在線人數。
-- 3. 前端只能呼叫受控 RPC，不能直接讀寫資料表。

begin;

create table if not exists public.wrg_site_stats (
  id smallint primary key check (id = 1),
  total_views bigint not null default 0 check (total_views >= 0),
  updated_at timestamptz not null default now()
);

insert into public.wrg_site_stats (id, total_views)
values (1, 0)
on conflict (id) do nothing;

create table if not exists public.wrg_site_presence (
  session_id text primary key,
  page_path text not null default '/',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists wrg_site_presence_last_seen_idx
  on public.wrg_site_presence (last_seen desc);

alter table public.wrg_site_stats enable row level security;
alter table public.wrg_site_presence enable row level security;

-- 不開放資料表給前端直接操作，只透過下方 SECURITY DEFINER 函式。
revoke all on table public.wrg_site_stats from public, anon, authenticated;
revoke all on table public.wrg_site_presence from public, anon, authenticated;

create or replace function public.wrg_record_site_visit(
  p_session_id text,
  p_page_path text default '/'
)
returns table(total_views bigint, online_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id text := left(trim(coalesce(p_session_id, '')), 128);
  v_page_path text := left(coalesce(nullif(trim(p_page_path), ''), '/'), 500);
  v_total_views bigint;
begin
  if char_length(v_session_id) < 8 then
    raise exception 'invalid session id';
  end if;

  insert into public.wrg_site_stats as s (id, total_views, updated_at)
  values (1, 1, now())
  on conflict (id) do update
    set total_views = s.total_views + 1,
        updated_at = now();

  insert into public.wrg_site_presence (session_id, page_path, first_seen, last_seen)
  values (v_session_id, v_page_path, now(), now())
  on conflict (session_id) do update
    set page_path = excluded.page_path,
        last_seen = now();

  -- 避免在線資料表無限成長；過期一天的匿名 session 直接清除。
  delete from public.wrg_site_presence
  where last_seen < now() - interval '1 day';

  select s.total_views
    into v_total_views
  from public.wrg_site_stats s
  where s.id = 1;

  return query
  select
    v_total_views,
    count(*)::bigint
  from public.wrg_site_presence p
  where p.last_seen >= now() - interval '2 minutes';
end;
$$;

create or replace function public.wrg_touch_site_presence(
  p_session_id text,
  p_page_path text default '/'
)
returns table(total_views bigint, online_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id text := left(trim(coalesce(p_session_id, '')), 128);
  v_page_path text := left(coalesce(nullif(trim(p_page_path), ''), '/'), 500);
begin
  if char_length(v_session_id) < 8 then
    raise exception 'invalid session id';
  end if;

  insert into public.wrg_site_presence (session_id, page_path, first_seen, last_seen)
  values (v_session_id, v_page_path, now(), now())
  on conflict (session_id) do update
    set page_path = excluded.page_path,
        last_seen = now();

  return query
  select
    coalesce((select s.total_views from public.wrg_site_stats s where s.id = 1), 0)::bigint,
    count(*)::bigint
  from public.wrg_site_presence p
  where p.last_seen >= now() - interval '2 minutes';
end;
$$;

revoke all on function public.wrg_record_site_visit(text, text) from public;
revoke all on function public.wrg_touch_site_presence(text, text) from public;
grant execute on function public.wrg_record_site_visit(text, text) to anon, authenticated;
grant execute on function public.wrg_touch_site_presence(text, text) to anon, authenticated;

commit;
