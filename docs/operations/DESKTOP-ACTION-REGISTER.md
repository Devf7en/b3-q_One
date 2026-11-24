# b3Ɛq::One — Desktop Action Register
Status: handoff; **not evidence of completed acceptance**. Owner: project operator. Never commit credentials, private keys, environment files or live session tokens.

## D01 — Local source and baseline (Mac / VS Code)
- [ ] Open the **existing** clone of Devf7en/b3-q_One in VS Code; do not replace or reset unrelated working changes.
- [ ] In VS Code Terminal, run:
```sh
pwd
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch origin
git log -5 --oneline --decorate
node --version
```
- [ ] Confirm remote is the expected repository, Node >=22, and inspect local changes **before** switching branches or pulling. Development branch: `feat/one-foundation-v1`; draft PR #1. Do not force-push.
- [ ] Run `npm test` after installing dependencies only from a reviewed, pinned dependency manifest. Identity CI installs `jose@6.1.0` explicitly; database integration uses `pg@8.16.3`. Do not assume `npm test` alone exercises PostgreSQL, browser or identity integration.
- [ ] Record commit SHA, test output, OS/Node version and any failures (redact tokens).

## D02 — Docker Desktop and database (Mac)
- [ ] Confirm Docker Desktop engine and Compose: `docker version`, `docker compose version`, `docker compose config` (inspect for leaked environment values before sharing output).
- [ ] Inspect `compose.yaml` and `database/migrations/001_runtime.sql` through `009_evidence_read.sql` before starting anything.
- [ ] Verify PostgreSQL is internal-only, no public database port, application service is not attached to the database network, and volumes are persistent.
- [ ] Use disposable test data; run database, data-runtime, recovery and operational acceptance workflows in a safe environment. Preserve existing Docker stacks and volumes.
- [ ] Capture `docker compose ps` and sanitized health logs. Never post database passwords.

## D03 — Identity provider configuration (account administrator)
- [ ] Decide whether an existing Auth0/OIDC tenant can be used **without buying another service**.
- [ ] Create or select a dedicated **staging** OIDC application, with authorization-code + PKCE (public client), RS256 ID tokens and a trusted HTTPS issuer/JWKS endpoint.
- [ ] Register exact callback `https://<staging-host>/session/callback` and exact allowed origin; replace placeholder only after hostname is assigned.
- [ ] Record non-secret issuer URL, client ID, redirect URL and JWKS URL in a private staging configuration inventory; keep secrets outside GitHub and static pages.
- [ ] Verify nonce, audience, issuer, expiry, access-token hash and logout behavior with a real browser. Review signing-key rotation and token revocation policy.
- [ ] No production authentication until real-provider acceptance succeeds.

## D04 — DNS / HTTPS / hosting
- [ ] Verify `one.f7en.com` and `one.f7en.com/preview/` from a desktop browser: landing, JS/CSS/JSON requests, 16 environments, 18 workspaces, controls, responsive behavior.
- [ ] Use `curl -I https://one.f7en.com/` and `curl -I https://one.f7en.com/preview/`; record response status, certificate and date. Do not treat HTTP success as HTTPS proof.
- [ ] Determine an **actual** staging server with Node >=22, TLS reverse proxy, trusted Host forwarding and PostgreSQL reachability. Static GitHub Pages cannot run the Node login gateway.
- [ ] Verify staging DNS, TLS certificate, no direct public Node listener, restricted database network, security headers, rate limiting, logs and backups.
- [ ] Do not purchase Node hosting or deploy production without a separate explicit release decision.

## D05 — Visual regression / preserved primitives
- [ ] Desktop Chrome/Safari/Firefox: verify single-row navigation where viewport allows, logo proportions, top-right user icon, compact sticky account card, account sections and explicit close/pin.
- [ ] Check workspace/environment/theme, Control Center/Observatory mode, dock visibility, lock, floating Explorer/Inspector/Console, stacking, sizing, presets and persistence across reload.
- [ ] Verify no controls disappear on narrow viewports; test keyboard focus, escape/close and reduced motion.
- [ ] Capture redacted screenshots and browser console errors; compare against the canonical macOS-style baseline. Do not overwrite original visual references.

## D06 — Staging governance acceptance (after D03–D04)
- [ ] Provision **separate** viewer, operator and approver staging accounts in the same tenant and a second isolated tenant.
- [ ] Verify viewer reads only, operator creates proposal, approver approves **someone else's** proposal, own approval rejected, wrong digest/version rejected, second-tenant access denied.
- [ ] Verify Observatory cannot mutate, logout invalidates session, duplicate cookies/headers fail closed, cross-origin POST denied, malformed/oversize JSON rejected, callback replay rejected.
- [ ] Verify immutable plan/approval/audit evidence, rollback on failure, idempotency/concurrency and restoration from backup. Do not execute a real infrastructure change.
- [ ] Preserve exact commit SHA, CI run URL, timestamps, sanitized logs and test matrix.

## D07 — Provider connections (deferred, requires operator approval)
- [ ] Inventory actual hosting, DNS, container, GitHub and database providers and required read-only scopes.
- [ ] Start with read-only, least-privilege credentials in a secret manager; test inventory freshness and tenant/project mapping.
- [ ] Do not enable provider mutation or live provisioning until independent security review, rollback plan, staged dry-run, authorization and audit acceptance.

## Open engineering gates
- Authenticated governance HTTP routes are opt-in and require dedicated regression/CI verification.
- Browser account sign-in and proposal UI still need server integration.
- Session runtime needs staging TLS, reverse-proxy trust model, rate limits, CSRF and session lifecycle review.
- Evidence read response may expose raw collector payload fields; disclosure minimization review required.
- Production IdP, signed evidence provenance, collector trust, backups, disaster recovery and release gates are not verified.
- Current GitHub Pages preview is static, not a production API or authenticated runtime.

## Evidence handoff
For each completed desktop item, report: item ID, date/time with timezone, git SHA, machine/OS, command or test name, pass/fail, sanitized output, screenshot or CI URL, blocker and next action. **Never paste passwords, API keys, cookies, access tokens or private environment files.**
