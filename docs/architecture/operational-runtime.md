# Integrated operational runtime

The server factory composes the real verifier, restricted identity lookup, tenant transaction boundary, governance service and HTTP gateway. Separate trusted pools are required. Acceptance uses disposable PostgreSQL, generated RSA keys, isolated JWKS transport and loopback HTTP. No production listener, credentials, browser session, external identity provider or infrastructure execution is enabled. Production requires TLS, dependency lockfile, role ownership review, revocation, rate limits and deployment acceptance.
