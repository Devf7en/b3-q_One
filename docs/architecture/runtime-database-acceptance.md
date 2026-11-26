# Runtime database acceptance

Dedicated disposable PostgreSQL 16 CI applies migrations 001–003 and tests missing tenant context, cross-tenant reads and writes, and plan mutation rejection under a non-superuser role. Fixtures roll back. CI password is disposable, not a deployment credential. This does not prove authenticated membership, transactional audit, concurrent approval, browser behavior or production isolation. Next implement a trusted transaction adapter and expand database tests for approvals, audit, evidence and rollback. No production deployment.
