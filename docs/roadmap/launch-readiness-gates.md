# b3Ɛq::One — launch readiness gates

Status: working acceptance plan, not proof of production readiness.
Source branch: feat/one-foundation-v1.
Mission: provider-neutral intent-driven hosting and business operating system.

## Gate A — Design and interaction acceptance
- Confirm app and Pages preview styles and navigation scripts match.
- Browser acceptance: one-row header, More/My Account width, mobile submenu navigation, keyboard and touch behavior, desktop dock preservation.
- Test at 390px, 768px and 1440px, then verify on a physical mobile device.
- Verify Pages publication separately from application CI.
- Blocker policy: failing checks remain open; do not downgrade functionality to pass.

## Gate B — Canonical registries and workspace behavior
- Reconcile 16 environments, 18 workspaces and 8 factory families with their canonical JSON contracts.
- Check navigation, selections, persistence, docking and responsive presentation.
- Record missing functional tests and demonstrations separately.

## Gate C — Governance and authorized execution
- Every mutating operation requires authenticated, server-side authorization and an audit trail.
- Establish provisioning approval, denial, idempotency, rollback and failure evidence.
- No credentials in static preview, browser storage, logs or repository.

## Gate D — Operational runtime
- Verify container, PostgreSQL, identity, data, recovery and operational runtime checks from GitHub Actions.
- Distinguish synthetic demonstration, cached evidence and live connected infrastructure.
- Validate actual provisioning and restoration before any production claim.

## Gate E — Dual surfaces and release
- Control Command Center is permission-gated for authorized operations.
- Project Observatory remains read-only, with source, observation time, freshness and state for claims.
- Preserve reciprocal navigation and common design tokens.
- Publish candidate manifests, security gates, staging acceptance and rollback instructions.
- Production promotion only after explicit approval and documented passing evidence.

## Current evidence interpretation
- README states foundation only; no live infrastructure or production readiness is claimed.
- Passing GitHub workflows validate their defined scopes, not full production readiness.
- Browser and Pages checks must be re-verified after each relevant change.
