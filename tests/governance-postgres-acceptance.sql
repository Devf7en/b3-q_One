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
-- Lifecycle: a request past its deadline cannot be approved, and expiry is terminal.
UPDATE one_runtime.governance_requests SET expires_at=now()-interval '1 minute'
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND id='00000000-0000-0000-0000-000000000003';
DO $lifecycle$ DECLARE changed integer;
BEGIN
 UPDATE one_runtime.governance_requests SET status='approved',
 decided_by='00000000-0000-0000-0000-000000000004',decided_at=now()
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND id='00000000-0000-0000-0000-000000000003'
 AND status='pending' AND expires_at>now()
 AND requested_by<>'00000000-0000-0000-0000-000000000004';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'expired request approved'; END IF;
 UPDATE one_runtime.governance_requests SET status='expired',decided_at=now()
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND id='00000000-0000-0000-0000-000000000003'
 AND status='pending' AND expires_at<=now();
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'expiry transition failed'; END IF;
END $lifecycle$;
INSERT INTO one_runtime.governance_audit(tenant_id,request_id,actor_id,event)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','expired');
DO $terminal$ DECLARE changed integer;
BEGIN
 UPDATE one_runtime.governance_requests SET status='approved',
 decided_by='00000000-0000-0000-0000-000000000004',decided_at=now()
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND id='00000000-0000-0000-0000-000000000003'
 AND status='pending';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'terminal expiry was reversed'; END IF;
 IF (SELECT count(*) FROM one_runtime.governance_audit WHERE event='expired')<>1
 THEN RAISE EXCEPTION 'expiry audit missing'; END IF;
END $terminal$;
-- Evidence reconciliation using actual tenant-scoped PostgreSQL rows.
DO $evidence$ DECLARE request_status text; request_actor uuid; events text[]; actors uuid[];
BEGIN
 SELECT status,requested_by INTO request_status,request_actor
 FROM one_runtime.governance_requests
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND id='00000000-0000-0000-0000-000000000003';
 SELECT array_agg(event ORDER BY id),array_agg(actor_id ORDER BY id)
 INTO events,actors FROM one_runtime.governance_audit
 WHERE tenant_id='00000000-0000-0000-0000-000000000001'
 AND request_id='00000000-0000-0000-0000-000000000003';
 IF request_status<>'expired' OR events<>ARRAY['registered','expired']::text[]
 OR actors[1]<>request_actor OR actors[2] IS NULL
 THEN RAISE EXCEPTION 'lifecycle evidence reconciliation failed'; END IF;
END $evidence$;
-- An absent terminal event must be detectable without mutating immutable audit.
INSERT INTO one_runtime.governance_requests
 (tenant_id,id,operation,target,reason,requested_by,status,decided_at,expires_at)
 VALUES ('00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000006','service.restart','staging',
 'missing audit fixture','00000000-0000-0000-0000-000000000002',
 'expired',now(),now()-interval '1 minute');
INSERT INTO one_runtime.governance_audit(tenant_id,request_id,actor_id,event)
 VALUES ('00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000002','registered');
DO $missing$ BEGIN
 IF (SELECT array_agg(event ORDER BY id) FROM one_runtime.governance_audit
 WHERE request_id='00000000-0000-0000-0000-000000000006')
 = ARRAY['registered','expired']::text[]
 THEN RAISE EXCEPTION 'missing expiry evidence not detected'; END IF;
END $missing$;
-- Decision actor mismatch must be detectable from stored rows.
INSERT INTO one_runtime.governance_requests
 (tenant_id,id,operation,target,reason,requested_by,status,decided_by,decided_at)
 VALUES ('00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000007','service.restart','staging',
 'actor mismatch fixture','00000000-0000-0000-0000-000000000002',
 'approved','00000000-0000-0000-0000-000000000004',now());
INSERT INTO one_runtime.governance_audit(tenant_id,request_id,actor_id,event)
 VALUES ('00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000002','registered'),
 ('00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000005','approved');
DO $mismatch$ BEGIN
 IF (SELECT a.actor_id=r.decided_by FROM one_runtime.governance_audit a
 JOIN one_runtime.governance_requests r ON r.tenant_id=a.tenant_id AND r.id=a.request_id
 WHERE a.request_id='00000000-0000-0000-0000-000000000007' AND a.event='approved')
 THEN RAISE EXCEPTION 'mismatched decision actor not detected'; END IF;
END $mismatch$;
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
