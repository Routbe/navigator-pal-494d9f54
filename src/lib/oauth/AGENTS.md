## OAuth provider rules
- OAuth client console settings (publishing status, PKCE, token TTL, IP allowlist, account discovery) are enforced in `provider.server.ts`/`console.functions.ts` (this folder) server-side, never only in the UI. Why: the console is the developer's control plane; the OIDC endpoints are the security boundary.
- New OAuth client secrets are stored as `v2$` peppered SHA-256 (`client-secret.ts`), legacy plain hashes stay valid until rotated. Why: no forced re-issue for existing apps.
- `rout_handle` is shared only when the app enabled Universal Handle Sync (`handle_sync_enabled`, db/67) and `profile` was granted (`routHandleClaim`). Why: apps must opt into identity data.
