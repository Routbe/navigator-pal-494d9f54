# Check of the Developer Console and AI prompts, and fixes

## What the check found
Working:
- All 23 sign-in and prompt tests pass, and there are no build errors.
- The Universal Handle Sync switch is on the Scopes and Advanced pages and is saved per app. `rout_handle` is only sent when the switch is on and `profile` was granted.
- The AI Prompts tab has three sections that open and close, each with a copy button, filled in with the app's real name and client_id. No secret is ever included.
- The `user.handle.updated` preview is on API & Webhooks.

Not finished or not consistent:
1. The public sign-in settings (discovery) don't list which claims exist, so `rout_handle` isn't advertised. The earlier plan promised this.
2. The new labels are English only. The plan promised NL/EN/FR/DE.
3. The Developers page (`/developers`) doesn't mention Universal Handle Sync, `rout_handle` or the webhook.
4. The Developers page says Rich Identity sends `is_verified_person` / `is_verified_business` / `is_influencer`, but the server actually sends `rout_public_activity`. The page and the server disagree.
5. The "Full integration" prompt and the database templates (SQL/Prisma) ignore Handle Sync: there's no `username` mapping and no webhook route.
6. The webhook preview shows a dummy client_id and doesn't explain how to check the signature.
7. The Badge prompt points at an endpoint that doesn't exist yet. It's only marked "coming soon".
8. Still open from the earlier "Login met ROUT" plan: a "back to the app" button on errors, a full step-by-step sign-in test, the 500×650 popup check, the button kit page (`/brand/button`), the error table in 4 languages, and a test that badges are only shared with consent.

## What I'll fix now (items 1-7)
- **Discovery:** add `claims_supported`, including `rout_handle` and `rout_public_activity`.
- **Prompts, more complete:**
  - Handle Sync prompt: steps for the callback, the database column (`username` unique, `rout_id`), conflict handling, the webhook route with signature check and retries, and test cases.
  - Full prompt: Handle Sync instructions when the switch is on.
  - SQL/Prisma templates: a `username` column and a webhook log table when Handle Sync is on.
  - Badge prompt: request/response examples, retries, idempotency key, and a note that it's a preview.
- **Webhook:** a picker for your own apps so the sample shows the real client_id, plus a short explanation of the signature (`t=…,v1=` HMAC-SHA256) with a verification snippet.
- **Developers page:** a "Universal Handle Sync & webhooks" section, a corrected Rich Identity row, and `rout_handle` in the claims table.
- **Languages:** console labels for Handle Sync, webhooks and AI Prompts in NL/EN/FR/DE through the existing translation files. The prompts themselves stay in English, which works best for AI tools.
- **Tests:** the discovery address lists `rout_handle`; the full prompt and templates contain the Handle Sync steps only when the switch is on; the Developers page claims match what the server sends.

## Afterwards (item 8)
I'll finish the six open "Login met ROUT" items in a separate step. The full test with a real signed-in user still needs the Neon database.

## Technical
- `src/routes/[.]well-known.openid-configuration.ts`: `claims_supported`.
- `integration-templates.ts`: `TemplateApp.handleSyncEnabled`; extend `buildAiPrompt`, `buildSqlSchema`, `buildPrismaSchema`, `buildHandleSyncPrompt`, `buildBadgePrompt`; `SCOPE_CLAIMS.profile` + `rout_handle` (conditional); export `WEBHOOK_VERIFY_SNIPPET`.
- `console.api.tsx`: app picker via `useConsoleApps`.
- `developers.tsx`: new section and corrected table.
- `src/locales/{nl,en,fr,de}.json`: `console.handleSync.*`, `console.webhooks.*`, `console.aiPrompts.*`.
- Tests in `integration-templates.test.ts` and a discovery test.
