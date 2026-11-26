\set ON_ERROR_STOP on
CREATE SCHEMA IF NOT EXISTS one_runtime;
\ir ../packages/governance-records/schema.sql
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='one_governance_test') THEN
  CREATE ROLE one_governance_test NOLOGIN;
 END IF;
END $$;
GRANT USAGE ON SCHEMA one_runtime TO one_governance_test;
GRANT SELECT,INSERT,UPDATE ON one_runtime.governance_requests TO one_governance_test;
GRANT SELECT,INSERT ON one_runtime.governance_audit TO one_governance_test;
GRANT USAGE ON SEQUENCE one_runtime.governance_audit_id_seq TO one_governance_test;
SET ROLE one_governance_test;
BEGIN;
SELECT set_config('one.tenant_id','00000000-0000-0000-0000-000000000001',true);
INSERT INTO one_runtime.governance_requests(tenant_id,id,operation,target,reason,requested_by)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','service.restart','staging','incident','00000000-0000-0000-0000-000000000002');
INSERT INTO one_runtime.governance_audit(tenant_id,request_id,actor_id,event)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','registered');
DO $$ BEGIN
 IF (SELECT count(*) FROM one_runtime.governance_requests)<>1 THEN RAISE EXCEPTION 'tenant request missing'; END IF;
 IF (SELECT count(*) FROM one_runtime.governance_audit)<>1 THEN RAISE EXCEPTION 'audit missing'; END IF;
END $$;
-- Verify append-only enforcement even when a role has UPDATE/DELETE privileges.
RESET ROLE;
GRANT UPDATE,DELETE ON one_runtime.governance_audit TO one_governance_test;
SET ROLE one_governance_test;
SELECT set_config('one.tenant_id','00000000-0000-0000-0000-000000000001',true);
DO $audit$ BEGIN
 BEGIN
  UPDATE one_runtime.governance_audit SET event='approved';
  RAISE EXCEPTION 'audit update unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN
  IF SQLSTATE <> '42501' THEN RAISE; END IF;
 END;
 BEGIN
  DELETE FROM one_runtime.governance_audit;
  RAISE EXCEPTION 'audit delete unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN
  IF SQLSTATE <> '42501' THEN RAISE; END IF;
 END;
END $audit$;
SAVEPOINT before_self_approval;
DO $$ BEGIN
 BEGIN
  UPDATE one_runtime.governance_requests SET status='approved',decided_by='00000000-0000-0000-0000-000000000002',decided_at=now();
  RAISE EXCEPTION 'self approval unexpectedly allowed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END $$;
ROLLBACK TO SAVEPOINT before_self_approval;
SELECT set_config('one.tenant_id','00000000-0000-0000-0000-000000000009',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM one_runtime.governance_requests) THEN RAISE EXCEPTION 'cross tenant request visible'; END IF;
 IF EXISTS(SELECT 1 FROM one_runtime.governance_audit) THEN RAISE EXCEPTION 'cross tenant audit visible'; END IF;
END $$;
SAVEPOINT before_cross_tenant;
DO $$ BEGIN
 BEGIN
  INSERT INTO one_runtime.governance_requests(tenant_id,id,operation,target,reason,requested_by)
  VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','service.restart','staging','cross tenant','00000000-0000-0000-0000-000000000002');
  RAISE EXCEPTION 'cross tenant write unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK TO SAVEPOINT before_cross_tenant;
ROLLBACK;
RESET ROLE;
