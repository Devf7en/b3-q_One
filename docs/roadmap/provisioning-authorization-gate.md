# Provisioning authorization gate — engineering acceptance

Status: **development / non-executable**. This document does not authorize deployment, infrastructure changes or execution.

## Trust boundaries
1. A trusted server verifies token issuer, audience, expiry and authoritative tenant membership.
2. The tenant-scoped PostgreSQL transaction rechecks locked membership and applies row-level security.
3. Governance request registration, decision and expiry write audit records in the same transaction.
4. Read-only inspection reconciles request status with audit event sequence, actor identity and timestamps.
5. Provisioning authorization assessment requires matching request ID, operation, target, approved status, unexpired database evidence and no reconciliation blockers.
6. The assessment returns `executable:false` unconditionally. There is no provisioning execution adapter in this boundary.

## Fail-closed conditions
- Missing/invalid identity or tenant membership, including membership changes
- Missing governance request or audit history
- Pending, rejected or expired status; approval expiry
- Mismatched request ID, operation or target
- Incorrect actor, malformed timestamps or out-of-order audit events
- Database failure or evidence inspection error

## Verification evidence
- `tests/governance-records.test.mjs`: role checks, lifecycle, evidence inspection
- `tests/provisioning-authorization.test.mjs`: assessment fail-closed cases
- `tests/provisioning-authorization-integration.test.mjs`: integration through tenant-scoped inspector mock
- `tests/governance-postgres-acceptance.sql`: actual PostgreSQL RLS, audit immutability, expiry and evidence fixtures
- `.github/workflows/governance-postgres-acceptance.yml`: PostgreSQL 16 CI

## Outstanding release blockers
- Verify all workflows against latest commit, not only earlier commits.
- Test end-to-end authorization with a real PostgreSQL-backed authenticated runtime, not just isolated SQL and mocked transactions.
- Enforce production database grants and migration ownership separation; document rollback.
- Bind any future adapter to a fresh, single-use authorization inside its execution transaction; prevent replay and time-of-check/time-of-use races.
- Add independent approval and deployment/release authorization; never infer permission to deploy from an approved governance record alone.
- Obtain explicit production deployment approval.
