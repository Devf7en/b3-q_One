# One::Browser session foundation

Server-side in-memory opaque session registry, bounded capacity and absolute expiry. Issue only after trusted server authentication. Resolve rechecks identity and tenant membership every time; revoke removes the session. Cookie uses __Host- prefix, Secure, HttpOnly, SameSite=Strict and Path=/ without Domain. No access token is returned to the browser.

This is a library, not a deployed login flow. Production requires OIDC authorization-code/PKCE callback, state and nonce validation, TLS, origin/CSRF checks for mutations and logout, session rotation, distributed protected storage, rate limits and operational acceptance. The registry is process-local and restart invalidates all sessions. Token lifetime remains enforced by the injected authenticator. Do not expose resolve results to clients. No production provider or credentials configured.
