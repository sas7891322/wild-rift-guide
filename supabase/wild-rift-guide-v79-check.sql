-- Wild Rift Guide v79 會員資料庫驗證

-- 1. 三張核心資料表與 RLS
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'favorite_heroes', 'recent_hero_views')
order by tablename;

-- 2. 欄位結構
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'favorite_heroes', 'recent_hero_views')
order by table_name, ordinal_position;

-- 3. RLS Policies
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'favorite_heroes', 'recent_hero_views')
order by tablename, policyname;

-- 4. Trigger
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema in ('public', 'auth')
  and trigger_name in ('profiles_set_updated_at', 'on_auth_user_created')
order by event_object_schema, event_object_table, trigger_name;

-- 5. 會員函式
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('handle_new_user', 'set_updated_at')
order by proname;
