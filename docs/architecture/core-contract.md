# Core contract v1 draft

Resource identity: tenantId, projectId, resourceId, kind, providerRef, lifecycleState, revision. Never embed credentials.

Evidence: source, observed_at (UTC), freshness, state (live/cached/unavailable/demonstration), resourceId, correlationId.

Intent lifecycle: draft -> planned -> simulated -> policy_checked -> approved -> executing -> verified or failed. Rollback is separately authorized and verified. Approval binds tenant, actor, plan digest, expiry and allowed operations. Execution is idempotent and revision checked.

Views share resource identities and tenant context. Server authorization is independent of presentation. Observatory uses read-only evidence projection.

This is a draft pending enterprise dependency reconciliation.
