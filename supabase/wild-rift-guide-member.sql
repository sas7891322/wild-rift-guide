-- Wild Rift Guide v79.0 會員系統
-- 請在 Supabase Dashboard > SQL Editor 執行整份腳本。

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_heroes (
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_id text not null check (char_length(hero_id) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, hero_id)
);

alter table public.profiles enable row level security;
alter table public.favorite_heroes enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.favorite_heroes from anon;
grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.favorite_heroes to authenticated;
grant all on table public.profiles to service_role;
grant all on table public.favorite_heroes to service_role;

drop policy if exists "Members can read their own profile" on public.profiles;
drop policy if exists "Members can update their own profile" on public.profiles;
drop policy if exists "Members can read their own favorites" on public.favorite_heroes;
drop policy if exists "Members can add their own favorites" on public.favorite_heroes;
drop policy if exists "Members can remove their own favorites" on public.favorite_heroes;

create policy "Members can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Members can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Members can read their own favorites"
on public.favorite_heroes for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Members can add their own favorites"
on public.favorite_heroes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Members can remove their own favorites"
on public.favorite_heroes for delete
to authenticated
using ((select auth.uid()) = user_id);

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
      coalesce(
        nullif(trim(metadata ->> 'nickname'), ''),
        nullif(split_part(coalesce(email_value, ''), '@', 1), ''),
        '會員'
      ),
      20
    ) as candidate
  ) source;
$$;

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, public.member_default_nickname(new.email, new.raw_user_meta_data))
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

-- 補建 SQL 執行前已存在的 Auth 使用者資料。
insert into public.profiles (id, nickname, created_at, updated_at)
select
  users.id,
  public.member_default_nickname(users.email, users.raw_user_meta_data),
  coalesce(users.created_at, now()),
  now()
from auth.users as users
on conflict (id) do nothing;
