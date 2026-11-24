\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE one_acceptance NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA one_runtime TO one_acceptance;
GRANT SELECT,INSERT,UPDATE,DELETE ON one_runtime.projects,one_runtime.plans TO one_acceptance;
INSERT INTO one_runtime.tenants VALUES ('00000000-0000-0000-0000-000000000001','A'),('00000000-0000-0000-0000-000000000002','B');
INSERT INTO one_runtime.identities VALUES ('00000000-0000-0000-0000-000000000003','fixture','operator');
INSERT INTO one_runtime.memberships VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','operator');
INSERT INTO one_runtime.projects VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','A'),('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000004','B');
INSERT INTO one_runtime.plans(tenant_id,id,version,project_id,created_by,manifest,digest) VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005',1,'00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003','{}',repeat('a',64));
SET LOCAL ROLE one_acceptance;
DO $$ BEGIN IF (SELECT count(*) FROM one_runtime.projects)<>0 THEN RAISE EXCEPTION 'Missing context leaked rows'; END IF; END $$;
SELECT set_config('one.tenant_id','00000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM one_runtime.projects)<>1 OR (SELECT name FROM one_runtime.projects)<>'A' THEN RAISE EXCEPTION 'Tenant isolation failed'; END IF;
 BEGIN
 INSERT INTO one_runtime.projects VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000006','forbidden');
 RAISE EXCEPTION 'Cross tenant insert succeeded';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
 UPDATE one_runtime.plans SET manifest='{"changed":true}';
 RAISE EXCEPTION 'Plan mutation succeeded';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Governance records are append-only' THEN RAISE; END IF; END;
END $$;
ROLLBACK;
