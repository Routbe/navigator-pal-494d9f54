<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules
- Neon is the only database; the runtime connects as least-privilege `rout_app` (`DATABASE_URL`, DML only, BYPASSRLS — access control is server-side) and schema changes are idempotent `db/NN_*.sql` files applied by `scripts/migrate.ts` with the owner `MIGRATION_URL`; runtime `create table if not exists` safety nets go through `runSchemaEnsure` so privilege errors are skipped. Why: Vercel deploy outside Lovable Cloud, and a leaked app credential must never alter schema or roles.
- Login ON rout.be (Better Auth, `better-auth.server.ts`) and login VIA rout.be (OIDC provider, `src/lib/oauth/*`) never share config; provider env vars use the `ROUT_PROVIDER_*` prefix. Why: prevents one role breaking the other.
- Sign-in tiles are always rendered; unconfigured providers show a notice instead of sending a request. Why: missing keys must never hide options.
- Social sign-in / OAuth callbacks for a provider whose credentials are missing are refused before Better Auth is created, with code `provider_not_configured` (400) plus a server warning naming the missing keys (`api_/auth/$.ts` + `isProviderConfigured`). Why: a missing key must never crash auth or block other methods.
- Public profile visibility (`publicProfile`, `timelineVisible` in `display_prefs`) is enforced server-side in the public profile/timeline server functions. Why: client checks alone leak data.
- Influencer/business verification hands out names through the `approved_handles` whitelist (`db/45`); users claim exactly one via `claimApprovedHandle`. Why: the admin approves names, never types them for the user.
- Bluesky/Mastodon accounts without a provider-verified email are created or linked only after a hashed 6-digit email code (`fediverse-otp.server.ts`, `db/46`). Why: typed emails alone allow account takeover.
- Birthdates live in the separate `user_birthdates` table (`db/48`) and are written only via `saveMyBirthdate`; verification requests return `birthdate_required` until present. Why: keeps legal data out of profile mass-assignment paths.

- Every environment variable name is documented in `ENVIRONMENT.md` (+ `.env.example`); login provider env lookups go through `envAny()` aliases in `better-auth.server.ts` (incl. `<PROVIDER>_OAUTH_CLIENT_*`), and the auth secret resolves via `resolveAuthSecret()` with a derived fallback so a missing variable never breaks every sign-in. Why: one findable list for deployers on Vercel.
- The sign-in screen treats a failed provider-status check as unknown (buttons still try), never as "all inactive". Why: a flaky status call must not disable working logins.

- Files live in Scaleway Object Storage via `src/lib/storage/s3.server.ts` (client bucket = member data under `users/<uid>/`, internal bucket = ROUT assets, admin-only); Neon stores only metadata. Why: keeps blobs out of the database and separates customer data from platform assets.
- Temporary QR files are private objects with `expires_at` in `shared_files` (db/51), served only through `/f/<id>` presigned redirects and purged by cron. Why: shared links must stop working after expiry.
- Every sign-in method returns through `/auth/continue`; destinations and tour drafts use HttpOnly cookies, never URLs. Why: zero-hop redirects and no token leakage.
- Auth emails use `sendLocalizedEmail`; static template IDs and non-blocking dispatch keep provider outages from breaking sign-in.
- After sign-in, tour drafts apply only to new accounts; taken handles fall back to onboarding. Why: existing members must never be overwritten.

- Page share images are drawn in code (`src/lib/page-og.server.ts`) from the single logo source `src/lib/brand/logo.ts`, one per page per locale at `/brand/og/<page>-<locale>.png`, cached in the internal bucket under a version prefix; never AI-generated, never rotated. Why: brand fidelity and crawler-cache stability.
- Bot checks run only through the self-hosted ALTCHA proof-of-work (`altcha.server.ts`, single-use via `altcha_used` db/54); `api_/auth/$.ts` refuses email sign-up/sign-in/magic-link/password-reset with `altcha_invalid` (400) before Better Auth runs. Why: no third-party bot service and no tracking.
- Studio autosaves private drafts and publishes with revision checks; public reads never use drafts. Why: incomplete edits stay private.
- Layered design lives as one JSON string in `display_prefs.designLayers`, normalized by `normalizeDesignLayers` server-side and on render. Why: display_prefs is flat; client input stays untrusted.
- Rate limits are counted in Neon (`rate_limits`, db/64) via `hitRateLimit`, failing open on database errors. Why: limits must hold across server instances without locking everyone out.
- Community stats are live counts; reviews show only when `approved` (db/65); empty sections hide. Why: no fake social proof.
- Approving a verification cancels that user's other open same-tier requests (`verification-dedupe.ts`). Why: no duplicate admin work.
