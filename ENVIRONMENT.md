
## PSP_ENCRYPTION_KEY
Server-only. AES-256-GCM key material for creator PSP secrets (`psp_credentials`). At least 32 random characters.

## MIGRATION_URL
Owner connection to Neon, used only by `bun scripts/migrate.ts` (never at runtime). Must differ from DATABASE_URL (rout_app). Not needed on Vercel.

## GITLAB_ISSUER
Optional GitLab server URL (default https://gitlab.com, no trailing slash). Set for self-managed GitLab.

## GITLAB_REDIRECT_URI
Optional. Defaults to <BETTER_AUTH_URL>/api/auth/callback/gitlab (e.g. https://rout.be/api/auth/callback/gitlab). Must match the GitLab application exactly.

## OAUTH_CLIENT_SECRET_PEPPER
Optional, server-only, 32+ random characters. Pepper for "Login met ROUT" client-secret hashes. Falls back to the auth secret. Changing it invalidates every app secret created since (rotate them in the console).

## SMS_PROVIDER
Optional: `android-gateway` (default), `twilio` or `brevo`. Without the keys below, phone verification shows "not configured" and sends nothing.

## SMS_API_KEY
Server-only. Android gateway bearer token, Brevo API key, or Twilio `<AccountSID>:<AuthToken>`.

## SMS_SENDER_ID
Sender name or number (required for Twilio and Brevo).

## SMS_GATEWAY_URL
Android gateway endpoint (POST JSON `{to, text, sender}`).

## PHONE_ENCRYPTION_KEY
Server-only, 32+ random characters. Encrypts stored phone numbers (AES-GCM) and hashes codes.
