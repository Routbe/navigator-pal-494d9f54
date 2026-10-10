# Developer Console: Universal Handle Sync, webhook preview, AI prompts

## What you get
1. **Universal Handle Sync toggle** (Scopes + Advanced tab, per app)
   - Premium switch with the text: "Opt-in to use ROUT as the Single Source of Truth for usernames. We will include the sovereign `@handle` in the OIDC UserInfo endpoint and prevent username squatting on your platform."
   - When on, sign-in and the UserInfo response include a `rout_handle` claim (the member's `@handle`). When off, nothing changes.
2. **Webhook preview** (API & Webhooks section)
   - A fixed event `user.handle.updated` with a description and a sample JSON payload (event id, timestamp, app's client_id, ROUT user id `sub`, old handle, new handle, a signature header example).
   - This step only shows the preview. Actually sending webhooks comes later and is not part of this plan.
3. **AI Prompts tab** (the existing tab, expanded)
   - Two expandable sections, each with a highlighted block and a copy button:
     - "1. Auth & Universal Handle Sync": your text, filled in with the app's real name and client_id.
     - "2. Badge Issuance API": the badge prompt from your upload (`POST /api/v1/badges/issue`, secret placeholder only).
   - The current assistant/stack picker and full integration prompt stay below as "3. Full integration".
   - The client secret is never put in a prompt.
4. Labels in English, Dutch, French and German.

## Limitation
Saving the toggle and the real `rout_handle` in sign-in need the Neon database. I'll write the database change and code, and test the claim logic without the database. The badge API is not built yet; the prompt describes it as planned.

## Technical
- `db/NN_oauth_handle_sync.sql`: `alter table oauth_clients add column if not exists handle_sync boolean not null default false` (idempotent), plus a `runSchemaEnsure` safety net.
- Server function `setHandleSync(appId, enabled)` with an owner check; included in the app read used by `useAppPage`.
- `provider.server.ts`: add `rout_handle` to id_token and UserInfo only when `client.handle_sync` and the `profile` scope is granted; add it to `claims_supported` in discovery.
- `integration-templates.ts`: `buildHandleSyncPrompt(app)`, `buildBadgePrompt(app)`, `HANDLE_UPDATED_SAMPLE`.
- Edits: `console.apps.$appId.scopes.tsx`, `.advanced.tsx`, `.ai-prompts.tsx`, `console.api.tsx`; translation files.
- Tests: `rout_handle` appears only with the toggle on and the scope granted; prompts contain the real client_id and never the secret.
