-- Controlled migration for the explicitly supported pre-expiry governance schema.
-- Run ONLY after inventory review and a backup, with migration-owner privileges.
-- Requires existing request/audit tables, tenant policies and immutable audit trigger.
-- Transactional: failure rolls back all DDL and data changes.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE one_runtime.governance_requests IN ACCESS EXCLUSIVE MODE;
DO $guard$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_schema='one_runtime' AND table_name='governance_requests'
  AND column_name='created_at')
 OR EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_schema='one_runtime' AND table_name='governance_requests'
  AND column_name='expires_at')
 THEN RAISE EXCEPTION 'Unsupported migration source schema'; END IF;
 IF NOT (SELECT relrowsecurity AND relforcerowsecurity
  FROM pg_class WHERE oid='one_runtime.governance_requests'::regclass)
 THEN RAISE EXCEPTION 'Request RLS protections required'; END IF;
 IF NOT (SELECT relrowsecurity AND relforcerowsecurity
  FROM pg_class WHERE oid='one_runtime.governance_audit'::regclass)
 THEN RAISE EXCEPTION 'Audit RLS protections required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger
  WHERE tgrelid='one_runtime.governance_audit'::regclass
  AND tgname='governance_audit_immutable' AND tgenabled<>'D')
 THEN RAISE EXCEPTION 'Immutable audit trigger required'; END IF;
END $guard$;
ALTER TABLE one_runtime.governance_requests
 ADD COLUMN expires_at timestamptz;
-- Existing pending requests are made ineligible for approval, rather than
-- silently extending their authorization. A separate reviewed operation
-- must handle expiry transitions and audit events.
UPDATE one_runtime.governance_requests
 SET expires_at = CASE WHEN status='pending'
  THEN now() - interval '1 second'
  ELSE COALESCE(decided_at,created_at,now()) END;
ALTER TABLE one_runtime.governance_requests
 ALTER COLUMN expires_at SET DEFAULT (now() + interval '24 hours'),
 ALTER COLUMN expires_at SET NOT NULL;
DO $constraints$
DECLARE constraint_name text;
BEGIN
 SELECT conname INTO constraint_name
 FROM pg_constraint WHERE conrelid='one_runtime.governance_requests'::regclass
 AND contype='c' AND pg_get_constraintdef(oid) LIKE '%status%'
 AND pg_get_constraintdef(oid) LIKE '%approved%'
 AND pg_get_constraintdef(oid) LIKE '%rejected%'
 AND pg_get_constraintdef(oid) NOT LIKE '%expired%'
 ORDER BY oid LIMIT 1;
 IF constraint_name IS NULL THEN
  RAISE EXCEPTION 'Expected legacy status constraint not found'; END IF;
 EXECUTE format('ALTER TABLE one_runtime.governance_requests DROP CONSTRAINT %I',constraint_name);
END $constraints$;
ALTER TABLE one_runtime.governance_requests
 ADD CONSTRAINT governance_requests_status_v2
 CHECK (status IN ('pending','approved','rejected','expired'));
-- Preserve pre-existing decision constraints. Expired transitions will be
-- permitted only after reviewing the old lifecycle check separately.
COMMIT;
