BEGIN;
CREATE ROLE one_identity NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA one_runtime TO one_identity;
CREATE FUNCTION one_runtime.resolve_membership(p_issuer text,p_subject text,p_tenant uuid)
RETURNS TABLE(user_id uuid,tenant_id uuid,role text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT i.id,m.tenant_id,m.role FROM one_runtime.identities i
 JOIN one_runtime.memberships m ON m.user_id=i.id
 WHERE i.issuer=p_issuer AND i.subject=p_subject AND m.tenant_id=p_tenant
$$;
REVOKE ALL ON FUNCTION one_runtime.resolve_membership(text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION one_runtime.resolve_membership(text,text,uuid) TO one_identity;
COMMIT;
