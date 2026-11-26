\set ON_ERROR_STOP on
-- Dedicated isolated PostgreSQL database only.
CREATE SCHEMA one_runtime;
CREATE TABLE one_runtime.governance_requests (
 tenant_id uuid NOT NULL,id uuid NOT NULL,operation text NOT NULL,target text NOT NULL,
 reason text NOT NULL,requested_by uuid NOT NULL,status text NOT NULL DEFAULT 'pending',
 decided_by uuid,decided_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,id),
 CONSTRAINT governance_requests_status_legacy CHECK(status IN ('pending','approved','rejected')),
 CONSTRAINT governance_requests_lifecycle_legacy CHECK(
 (status='pending' AND decided_by IS NULL AND decided_at IS NULL)
 OR (status IN ('approved','rejected') AND decided_by IS NOT NULL AND decided_at IS NOT NULL))
);
CREATE TABLE one_runtime.governance_audit (
 tenant_id uuid NOT NULL,id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL,actor_id uuid NOT NULL,event text NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT governance_audit_event_legacy CHECK(event IN ('registered','approved','rejected')),
 FOREIGN KEY(tenant_id,request_id) REFERENCES one_runtime.governance_requests(tenant_id,id)
);
ALTER TABLE one_runtime.governance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_audit FORCE ROW LEVEL SECURITY;
CREATE POLICY governance_requests_tenant ON one_runtime.governance_requests
 USING(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid);
CREATE POLICY governance_audit_tenant ON one_runtime.governance_audit
 USING(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid);
CREATE FUNCTION one_runtime.reject_governance_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $audit$
BEGIN RAISE EXCEPTION 'Governance audit events are append-only' USING ERRCODE='42501'; END;
$audit$;
CREATE TRIGGER governance_audit_immutable BEFORE UPDATE OR DELETE
ON one_runtime.governance_audit FOR EACH ROW
EXECUTE FUNCTION one_runtime.reject_governance_audit_mutation();
INSERT INTO one_runtime.governance_requests(tenant_id,id,operation,target,reason,requested_by)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',
'service.restart','staging','legacy pending','00000000-0000-0000-0000-000000000002');
INSERT INTO one_runtime.governance_requests(tenant_id,id,operation,target,reason,requested_by,status,decided_by,decided_at)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',
'service.restart','staging','legacy approved','00000000-0000-0000-0000-000000000002',
'approved','00000000-0000-0000-0000-000000000005',now());
INSERT INTO one_runtime.governance_audit(tenant_id,request_id,actor_id,event)
VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',
'00000000-0000-0000-0000-000000000002','registered'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',
'00000000-0000-0000-0000-000000000002','registered'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',
'00000000-0000-0000-0000-000000000005','approved');
\ir ../packages/governance-records/migrations/003-legacy-expiry-upgrade.sql
DO $verify$ BEGIN
 IF (SELECT count(*) FROM one_runtime.governance_requests)<>2
 OR (SELECT count(*) FROM one_runtime.governance_audit)<>3
 THEN RAISE EXCEPTION 'Legacy governance history changed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM one_runtime.governance_requests
 WHERE status='pending' AND expires_at<now())
 THEN RAISE EXCEPTION 'Legacy pending request not expired'; END IF;
 IF EXISTS (SELECT 1 FROM one_runtime.governance_requests WHERE expires_at IS NULL)
 THEN RAISE EXCEPTION 'Missing expiry backfill'; END IF;
END $verify$;
