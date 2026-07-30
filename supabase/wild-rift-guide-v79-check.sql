-- Wild Rift Guide v79.1 資料庫驗證（主 SQL 成功後再執行）
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'favorite_heroes', 'recent_hero_views')
order by table_name;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'favorite_heroes', 'recent_hero_views')
order by tablename, policyname;

select trigger_name, event_object_schema, event_object_table
from information_schema.triggers
where trigger_name in ('on_auth_user_created', 'profiles_set_updated_at')
order by trigger_name;
