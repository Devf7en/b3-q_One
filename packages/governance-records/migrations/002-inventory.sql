-- Read-only inventory for planning an explicit legacy upgrade.
-- Run with psql -v ON_ERROR_STOP=1 -f ... using a reviewed inspection role.
-- This script never modifies schema or data.
BEGIN READ ONLY;
SELECT current_database() AS database_name, current_user AS inspection_role,
       now() AS inspected_at;
SELECT n.nspname AS schema_name,c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='one_runtime'
AND c.relname IN ('governance_requests','governance_audit')
AND c.relkind IN ('r','p') ORDER BY c.relname;
SELECT table_name,column_name,data_type,is_nullable,column_default
FROM information_schema.columns WHERE table_schema='one_runtime'
AND table_name IN ('governance_requests','governance_audit')
ORDER BY table_name,ordinal_position;
SELECT cls.relname AS table_name,con.conname AS constraint_name,
       con.contype AS constraint_type,pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class cls ON cls.oid=con.conrelid
JOIN pg_namespace n ON n.oid=cls.relnamespace
WHERE n.nspname='one_runtime' AND cls.relname IN ('governance_requests','governance_audit')
ORDER BY cls.relname,con.conname;
SELECT tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='one_runtime'
AND tablename IN ('governance_requests','governance_audit')
ORDER BY tablename,policyname;
SELECT cls.relname AS table_name,trg.tgname AS trigger_name,
       trg.tgenabled AS enabled,pg_get_triggerdef(trg.oid) AS definition
FROM pg_trigger trg JOIN pg_class cls ON cls.oid=trg.tgrelid
JOIN pg_namespace n ON n.oid=cls.relnamespace
WHERE n.nspname='one_runtime' AND cls.relname IN ('governance_requests','governance_audit')
AND NOT trg.tgisinternal ORDER BY cls.relname,trg.tgname;
ROLLBACK;
