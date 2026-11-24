# Session HTTP transport
Node HTTP adapter for the read-only session gateway. Rejects duplicate sensitive headers and request bodies, bounds header and path size, sets timeouts and no-store responses. Loopback tests use disposable sessions. Production requires a trusted TLS termination boundary, host validation, reverse proxy configuration and OIDC login. No listener is deployed.
