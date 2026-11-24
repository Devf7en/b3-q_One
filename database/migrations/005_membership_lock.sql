BEGIN;
CREATE FUNCTION one_runtime.lock_membership(p_tenant uuid,p_user uuid) RETURNS TABLE(role text)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
 SELECT m.role FROM one_runtime.memberships m
 WHERE m.tenant_id=p_tenant AND m.user_id=p_user
 AND p_tenant=nullif(current_setting('one.tenant_id',true),'')::uuid
 FOR SHARE
$$;
REVOKE ALL ON FUNCTION one_runtime.lock_membership(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION one_runtime.lock_membership(uuid,uuid) TO one_service;
REVOKE UPDATE(role) ON one_runtime.memberships FROM one_service;
COMMIT;
