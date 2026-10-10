# ROUT: invitations, mobile polish, Explore, admin and verification via official login

Work happens in this order. Each phase is checked on mobile (390px) and desktop (1280px) before the next one starts.

## Phase 0: Check what is already there
- Click through every main page on mobile and desktop: home, Explore, About, Profile Hub, dashboard, admin and the invitation links. Make a list of anything broken or overlapping.
- Finish the leftover items from the previous round: the remaining fixed Dutch labels in the dashboard, and an admin screen for approving reviews.

## Phase 1: Invitation links with 10% discount
Today `rout.be/r/u/jona00` only forwards the visitor to Jona's profile. New behaviour:
- The visitor lands on `rout.be/u/jona00` and first sees an invitation card at the top: "Jona invites you to ROUT, with 10% off any plan." It has a "Claim your handle" button and links to Explore and About. The visitor can close the card and still see the profile.
- The invitation is remembered on the visitor's device and is never put in the web address. It is linked to the account at sign-up.
- Only the new user gets 10% off the plan they pick. The existing rewards for the person who invites (3 invites = 50%, 10 = free) stay as they are.
- Prices show the discount everywhere, and payment uses the same price.
- Invalid or unknown handles show a normal page with no discount.
- Add tests: an invited user pays exactly 10% less; self-invites and unknown handles get no discount.

## Phase 2: Mobile and desktop design
- Profile Hub and dashboard: fix overlapping buttons and give long names room. Make sure buttons are at least 44px to tap on mobile.
- Each page gets its own layout: mobile gets a stacked layout with a fixed bottom action bar, desktop gets a side panel and wider grids.
- Screenshot every main page at both sizes before and after the changes.

## Phase 3: Explore page, much richer
- Filters by category (creators, developers, businesses, verified) and by platform badge, plus search that waits until you stop typing.
- Rows: the moving avatar strip, "new this week", "recently verified", featured profiles, and reviews.
- Profile cards show their platform badges and open with one tap. A quick-view sheet on mobile, a side preview on desktop.
- Load more as you scroll. Nicer empty states and loading placeholders.

## Phase 4: Admin portal overhaul
- A new structure: side menu on desktop and tabs on mobile, with an overview of numbers at the top (open verifications, payments, reports, new members).
- Every list gets search, filters, bulk actions and works on mobile (cards instead of wide tables).
- Verifications grouped per user, as already built. Review moderation. A clearer audit log.
- The large admin page is split into separate sections so it loads faster and breaks less easily.

## Phase 5: Social verification via official login
- **Google:** one Google login for sign-in (name, email) and for YouTube. Extra permission (YouTube read-only, later Calendar) is only asked when the user turns on that feature. After YouTube confirms the user owns the channel, the YouTube badge is given automatically.
- **GitHub and GitLab:** linking the account gives the badge straight away, based on the fixed account ID.
- **Bluesky and Wsocial:** one shared check for both, via the AT Protocol (DNS record or handle). Wsocial gets its own look and the `wsocial.eu` domain.
- **X and Meta (Instagram/Facebook):** buttons and login flow are built, but show "not active yet" until their developer apps and keys exist. Instagram and Facebook will read the profile through Meta's official access, not by reading the web page.
- **Fallback** for platforms without a login: a code in a post or bio, checked again periodically.
- Each linked account is stored with its status, platform account ID, last check time and an encrypted token. Badges come only from a check done on our own server.

## Open items / blockers
- X and Meta: verifying only works once their developer apps exist and (for Meta) are approved. Until then the buttons show "not active yet".
- Google YouTube permission: Google must review the app's consent screen before it works for all users.
- Database changes only run once Neon is connected.

## Technical details
- Referral: the `/r/u/$alias` and `/r/$username` routes set an HttpOnly `rout_ref` cookie (30 days) and redirect to the profile with no query string. The profile reads the cookie server-side and shows `InviteBanner`. On sign-up the code writes `referred_by`. `bestPriceCents` applies an `INVITEE_PERCENT_OFF = 10` constant, stacked after inviter rewards with a defined order. Tests go in `referral-discount.test.ts`.
- Google: Better Auth `google` provider with base scopes; a "link with extra scope" call uses `linkSocial({ provider: "google", scopes: [youtube.readonly] })`. Then a server check runs `channels?mine=true` and stores the channel ID.
- New `db/66_linked_accounts.sql`: `user_linked_accounts` (user_id, platform, provider_account_id, handle, status, method oauth|atproto|code, token_enc, scopes, last_checked_at), unique on (platform, provider_account_id), with grants to `rout_app`.
- AT Protocol engine: `atproto-verify.server.ts` with a per-network config (`bsky.social`, `wsocial.eu`). The existing Bluesky code is refactored to use it.
- X/Meta: generic OAuth provider entries gated by `isProviderConfigured` (an existing rule). Env names are added to `ENVIRONMENT.md`.
- The admin page is split into route-level sections under `_authenticated/admin.*`.
- Saved to memory: invitee 10% only for the new user; Wsocial domain `wsocial.eu`.
