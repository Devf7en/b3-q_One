-- Read-only migration preflight. Run using psql -v ON_ERROR_STOP=1.
-- No schema changes. Fails closed when the installation needs a tailored migration.
BEGIN READ ONLY;
DO $preflight$
DECLARE req regclass; aud regclass; missing text;
BEGIN
 req:=to_regclass('one_runtime.governance_requests');
 aud:=to_regclass('one_runtime.governance_audit');
 IF req IS NULL OR aud IS NULL THEN
  RAISE EXCEPTION 'Governance tables missing: bootstrap or explicit migration required';
 END IF;
 SELECT string_agg(required.name,', ') INTO missing
 FROM (VALUES ('tenant_id'),('id'),('operation'),('target'),('requested_by'),
  ('status'),('expires_at'),('decided_by'),('decided_at'),('created_at')) AS required(name)
 WHERE NOT EXISTS (
  SELECT 1 FROM pg_attribute a WHERE a.attrelid=req
  AND a.attname=required.name AND a.attnum>0 AND NOT a.attisdropped);
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'Governance requests missing columns: %',missing;
 END IF;
 SELECT string_agg(required.name,', ') INTO missing
 FROM (VALUES ('tenant_id'),('request_id'),('actor_id'),('event'),('occurred_at')) AS required(name)
 WHERE NOT EXISTS (
  SELECT 1 FROM pg_attribute a WHERE a.attrelid=aud
  AND a.attname=required.name AND a.attnum>0 AND NOT a.attisdropped);
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'Governance audit missing columns: %',missing;
 END IF;
 IF NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid=req)
 OR NOT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid=aud)
 THEN RAISE EXCEPTION 'RLS/FORCE RLS missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=aud
  AND tgname='governance_audit_immutable' AND tgenabled<>'D')
 THEN RAISE EXCEPTION 'Immutable audit trigger missing'; END IF;
 IF EXISTS (SELECT 1 FROM one_runtime.governance_requests
  WHERE status NOT IN ('pending','approved','rejected','expired') OR expires_at IS NULL)
 THEN RAISE EXCEPTION 'Invalid legacy lifecycle records'; END IF;
END $preflight$;
ROLLBACK;
