-- Apply only through a reviewed, privileged migration role; not from the browser.
-- Requires the existing one_runtime schema and tenant-scoped transaction context.
CREATE TABLE IF NOT EXISTS one_runtime.governance_requests (
 tenant_id uuid NOT NULL,
 id uuid NOT NULL,
 operation text NOT NULL CHECK(length(operation) BETWEEN 1 AND 512),
 target text NOT NULL CHECK(length(target) BETWEEN 1 AND 512),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 512),
 requested_by uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
 decided_by uuid,
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,id),
 CHECK ((status='pending' AND decided_by IS NULL AND decided_at IS NULL)
     OR (status IN ('approved','rejected') AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
     OR (status='expired' AND decided_by IS NULL AND decided_at IS NOT NULL)),
 CHECK(decided_by IS NULL OR decided_by<>requested_by)
);
CREATE TABLE IF NOT EXISTS one_runtime.governance_audit (
 tenant_id uuid NOT NULL,
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL,
 actor_id uuid NOT NULL,
 event text NOT NULL CHECK(event IN ('registered','approved','rejected','expired')),
 occurred_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(tenant_id,request_id) REFERENCES one_runtime.governance_requests(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS governance_audit_tenant_request_idx ON one_runtime.governance_audit(tenant_id,request_id,occurred_at);
ALTER TABLE one_runtime.governance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.governance_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS governance_requests_tenant ON one_runtime.governance_requests;
CREATE POLICY governance_requests_tenant ON one_runtime.governance_requests
 USING (tenant_id = nullif(current_setting('one.tenant_id',true),'')::uuid)
 WITH CHECK (tenant_id = nullif(current_setting('one.tenant_id',true),'')::uuid);
DROP POLICY IF EXISTS governance_audit_tenant ON one_runtime.governance_audit;
CREATE POLICY governance_audit_tenant ON one_runtime.governance_audit
 USING (tenant_id = nullif(current_setting('one.tenant_id',true),'')::uuid)
 WITH CHECK (tenant_id = nullif(current_setting('one.tenant_id',true),'')::uuid);
-- Migration operator must explicitly grant only required privileges to the
-- non-owner runtime role. Never grant TRUNCATE or broad schema ownership.

-- Immutable audit history: database enforcement also protects against accidental
-- UPDATE/DELETE by privileged maintenance sessions (superusers can override).
CREATE OR REPLACE FUNCTION one_runtime.reject_governance_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'Governance audit events are append-only' USING ERRCODE='42501';
END;
$$;
DROP TRIGGER IF EXISTS governance_audit_immutable ON one_runtime.governance_audit;
CREATE TRIGGER governance_audit_immutable
BEFORE UPDATE OR DELETE ON one_runtime.governance_audit
FOR EACH ROW EXECUTE FUNCTION one_runtime.reject_governance_audit_mutation();
