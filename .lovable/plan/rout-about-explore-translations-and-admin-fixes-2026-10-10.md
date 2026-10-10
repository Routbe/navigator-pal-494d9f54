# ROUT: About, Explore, translations and admin fixes

## Status check
- About (`/about`) and Explore (`/explore`) have not been redesigned yet. Explore still shows only a title and a simple gallery.
- The "Ontdek" button in the header is still hard-coded Dutch.
- Approving a verification only approves that one request. Duplicates stay open.
- The VIP-handles crash is still there. The likely cause is that the date field arrives as a date object instead of text, and the code then calls `.replace` on it.
- The three uploaded notes (app wizard, phone verification, "Login with ROUT") are separate projects. They are not part of this round.

## 1. VIP-handles crash (first, it is small)
- Make every text and date field on the VIP panel safe: dates become text first, and empty values show "—".
- Show an empty state when there are no VIP handles or when the data is malformed.

## 2. Duplicate verifications and batch approval
- When one request is approved, close every other open request from the same user for the same category/platform at the same time, marked as "approved (duplicate)". Only one badge and one notice go out.
- The admin list groups requests by user + platform, shows a "3 requests" chip, and has one Approve button per group.
- Add a test: approving one of two duplicates leaves zero open requests for that user/platform.

## 3. Translations (NL, EN, FR, DE)
- Replace "Ontdek" and every other hard-coded header and navigation label with translations.
- Go through the Profile Hub and dashboard screens and move fixed Dutch labels, help texts, buttons and tabs into the four language files.
- Fallback order: chosen language, then English, then Dutch. Raw keys are never shown.
- Add a script that lists keys missing in any language and fails when keys are missing.

## 4. Explore page redesign
- Fix the double-click bug: one tap opens the profile right away. Remove the click handler that competes with the link and preload the profile on hover or touch.
- Hero: keep the title and search, with a richer layout.
- Row 1: an endless strip of avatars moving left to right, with handle and verified mark. It pauses on hover and stays still when the visitor has turned off motion. A click opens the profile.
- Row 2: a grid of full profile cards with bio and official badges (YouTube, GitHub, Bluesky, Instagram…).
- Row 3: a scrolling row of community reviews.

## 5. About page redesign
Sections: mission statement, comparison table (ad-heavy link-in-bio tools vs ROUT: Infomaniak, OIDC, official OAuth, AT Protocol), verified integrations (YouTube, GitHub/GitLab, Bluesky/Wsocial, custom domains), live numbers, reviews, manifesto (AGPLv3, privacy, biophilic design), and a closing "Claim your handle" block. Everything is translated into all four languages.

## Honesty about numbers and reviews
- Live numbers (members, badges issued, uptime) come from real counts in the database and the health check, never from invented figures.
- Reviews: no fake quotes. I will add a small reviews list that only an admin can approve. Until there are approved reviews, the row is hidden, or shows real quotes you send me.

## Technical details
- VIP: `AdminVipPanel.tsx` `stamp()` gets `String(v ?? "")` / `instanceof Date` guards; audit other `.replace/.toLowerCase` uses in admin.
- Batch approve: in `approvePayment` (admin.server.ts), in a single transaction, update sibling pending rows with the same `user_id` + platform/category. `fetchPendingVerifications` returns a `duplicates` count; grouping is done in `AdminVerificationRequests.tsx` / `Admin.tsx`.
- Reviews: new idempotent `db/NN_community_reviews.sql` (status pending/approved). Public read only returns approved rows; metrics come from an aggregated public server function that is cached.
- Marquee: CSS keyframes with a duplicated track, `prefers-reduced-motion` respected, and tokens only.
- i18n: i18next `fallbackLng: ["en","nl"]`, plus `scripts/i18n-audit.ts`.
