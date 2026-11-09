-- Wild Rift Guide v91｜找隊友資料庫驗證

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('player_posts', 'player_reports')
order by tablename;

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('player_posts', 'player_reports')
order by table_name, ordinal_position;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('player_posts', 'player_reports')
order by tablename, policyname;

select trigger_name, event_object_table, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name = 'player_posts_set_updated_at';
