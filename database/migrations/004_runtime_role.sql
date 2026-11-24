BEGIN;
CREATE ROLE one_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA one_runtime TO one_service;
GRANT SELECT ON one_runtime.memberships,one_runtime.projects,one_runtime.plans,one_runtime.approvals,one_runtime.audit_events TO one_service;
-- PostgreSQL row locking requires UPDATE privilege on at least one column.
GRANT UPDATE(role) ON one_runtime.memberships TO one_service;
CREATE POLICY membership_no_update ON one_runtime.memberships AS RESTRICTIVE FOR UPDATE TO one_service USING (false) WITH CHECK (false);
GRANT INSERT ON one_runtime.plans,one_runtime.approvals,one_runtime.audit_events TO one_service;
COMMIT;
