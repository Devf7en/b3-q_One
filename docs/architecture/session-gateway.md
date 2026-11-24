# Same-origin session gateway

The dispatcher accepts only GET Observatory evidence and POST session logout. Trusted HTTPS origin configuration, origin and Fetch Metadata checks, server-side session resolution and tenant binding precede API dispatch. Logout requires exact Origin and clears the cookie. Responses are non-cacheable. No browser-supplied tenant or bearer token is used.

This is a transport-independent dispatcher, not a deployed HTTP listener. A trusted HTTP adapter must normalize headers, reject duplicate sensitive headers, enforce TLS, request limits and no CORS, and prevent token logging. OIDC callback, PKCE, session issuance and actual browser integration remain pending. No Control Center mutation or infrastructure execution is exposed.
