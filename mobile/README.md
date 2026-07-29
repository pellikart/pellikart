# Pellikart Mobile

iOS and Android apps for Pellikart, built with React Native + Expo against the
**same Supabase backend as the website**. Per the project plan, the admin panel
stays web-only.

This app lives inside the web repo on purpose: it compiles the web app's
`src/lib` directly, so both apps share one matching algorithm, one set of
pricing rules, and one data layer. Nothing in the web app was modified to make
this work.

---

## Getting started

```bash
cd mobile
npm install            # also creates the mobile/shared link (postinstall)
cp .env.example .env   # fill in the SAME Supabase project as the web app
npm start
```

Then press `a` for an Android emulator/device, `i` for iOS (macOS only), or scan
the QR code with Expo Go.

Without a `.env` the app still runs, but every backend call no-ops and the sign-in
screen reports that authentication is not configured.

### Google sign-in setup

Sign-in opens a system browser and returns via a deep link. The redirect URI must
be allow-listed once in **Supabase → Authentication → URL Configuration →
Redirect URLs**:

- Development (Expo Go): the `exp://…` URL printed when Metro starts
- Release builds: `pellikart://auth-callback`

---

## How the shared code is wired

`mobile/shared` is a **link** to `../src/lib` — a junction on Windows, a symlink
elsewhere. It is not checked in; `npm run link:shared` recreates it and
`postinstall` runs it automatically.

The link exists because Metro will not bundle files above its project root.
Two more obvious approaches were tried first and do not work:

| Approach | What happens |
| --- | --- |
| `watchFolders: ['../src']` | Silently ignored. Metro also enforces a *server root*, so shared imports fail with "none of these files exist" while naming a path that does. |
| `server.unstable_serverRoot = repoRoot` | Metro is satisfied, but Expo then resolves its own entry point relative to the repo root and looks for `./node_modules/expo-router/entry`, which only exists under `mobile/`. Fixing that needs hoisted node_modules, i.e. a real npm workspace. |

Linking the directory in sidesteps both while keeping exactly one copy on disk.

Imports use the `@shared/*` alias:

```ts
import { useStore } from '@shared/store'          // ../src/lib/store.ts
import { formatINR } from '@shared/helpers'       // ../src/lib/helpers.ts
```

### Two resolvers, deliberately separated

- **TypeScript** reads `tsconfig.json` → `paths`. Those pin `react`, `zustand`
  and `@supabase/supabase-js` at the mobile copies, because shared files would
  otherwise look for them in the web app's `node_modules` (which may not even be
  installed).
- **Metro** does *not* read them — `experiments.tsconfigPaths` is `false` in
  `app.json`, because the `react` pin points at `@types/react`, a types-only
  package Metro would try to execute. `metro.config.js` declares the runtime
  aliases itself, and pins the same packages as singletons so the bundle can
  never contain two Reacts.

### The one shared file that is replaced

`src/lib/supabase.ts` builds its client from `import.meta.env` (Vite-only; Hermes
cannot parse `import.meta`) and stores sessions in `localStorage`. Metro rewrites
every import of it to `src/lib/supabase.native.ts`, which is API-compatible but
uses `EXPO_PUBLIC_*` env vars, AsyncStorage, PKCE, and refreshes tokens on app
foreground instead of on a timer. All ~90 data functions in `supabase-db.ts` run
unchanged on top of it.

`src/lib/vendor-nav.ts` is the only other non-portable file (it is web-router
specific). The mobile app never imports it, and `tsconfig.json` excludes it.

---

## Layout

```
app/                    expo-router routes
  _layout.tsx           providers: SafeArea, AuthProvider (shared), Stack
  index.tsx             role gate → sign-in / role picker / couple / vendor
  sign-in.tsx           port of the web AuthPage
  (couple)/             couple app — a stack, matching the web (no bottom nav)
  (vendor)/             vendor app — bottom tabs, port of VendorBottomNav
src/
  components/ui.tsx     Screen, Text, Button, Card, Splash
  hooks/useSessionRole  port of the role resolution in the web App.tsx
  lib/auth.ts           Google OAuth over a deep link
  lib/supabase.native   the RN Supabase client
  screens/              screens rendered inline by the gate rather than routed
  theme/                design tokens ported from src/index.css
shared/                 → ../src/lib (link, not checked in)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Metro dev server |
| `npm run typecheck` | `tsc --noEmit` over the app **and** the shared lib |
| `npm run link:shared` | Recreate `mobile/shared` |
| `npm run doctor` | `expo-doctor` dependency check |

`npm run typecheck` deliberately covers `shared/`, so a breaking change to the
web app's business logic fails here rather than at runtime on a phone.

---

## Status

**Phase 1 (foundation) is complete**: project setup, shared-code wiring, design
system, Supabase auth with native session persistence, and the role-resolution
navigation shell.

**Phase 2 (couple app) core is complete**:

- Onboarding — the full seven-screen flow (names, GPS location, events, dates,
  guests, per-event budget), calling the shared `completeOnboarding` so web and
  mobile generate identical boards.
- Event board home — event-board tabs, category grid with the selected vendor
  per tile, running total, and "still picking" jump-offs.
- Category discovery — the matched vendor list per category, shortlist/like,
  and the detail sheet.
- Vendor detail sheet — photos, price, rating, description, includes, and
  contact (unlocked only), with add-to-event and visit/tasting request.
- Paywall — `VendorName` enforces plan §3 on the client: locked vendors show
  their anonymous code with **no purchase link anywhere** (iOS compliance);
  unlock entitlement is read from the shared backend, never sold in-app.

Deferred within Phase 2 (layered features, not blocking the core journey): the
Explore filter bar, the Compare tab, Decor briefs, the venue plate-package
picker, and the per-category selection editors inside the detail sheet (mehendi
matrix, makeup looks, catering menu). Review *writing* is gated on a completed
booking, so it lands with Phase 4.

**Phase 3 (vendor app) core is complete**:

- Availability calendar — interactive month grid; tap to block a day (whole day
  or a time range, all listings or specific ones) and tap to unblock, through
  the shared `toggleDateBlock`. One of the plan's two heaviest items.
- Profile view + edit — header with a live completeness bar, an editable
  Business Details sheet (persists via `updateVendorProfile`), and links into
  the management screens.
- Bookings — upcoming/completed/cancelled tabs, payment breakdown, and the
  milestone timeline with "mark next done" (`completeBookingMilestone`).
- Leads, visit requests, reviews — leads grouped by listing; visit requests
  with accept / propose-new-time / decline; reviews with public responses.

**Config-driven listing create/edit is now in** (the plan's heaviest item):

- A generic `SelectField` renderer (`FormField`) drives every category's question
  set straight from `vendor-category-config.ts` — add a question there and it
  appears on mobile with no code change, exactly as the plan requires.
- The multi-step `ListingForm` restates VendorAddListing's flow as an explicit
  ordered step list (rituals → config fields → pricing → inclusions → photos →
  review), shared by create (`listing-new`) and edit (`listing-edit`).
- Dedicated pricing editors ported: **Photography event packages** and
  **Hosts/Entertainers**. Generic categories use a starting-price slider.
- **Photo picking + upload** via expo-image-picker → the same vendor-photos
  bucket (demo mode keeps local URIs; live mode uploads).

Still deferred (heaviest web-only sub-editors, clearly flagged in-app rather
than half-built): Venue per-plate packages / service slots / paid rooms /
in-house decor, the Catering interactive menu builder, and Decor per-design
authoring (media + sizes). Venue and Catering can still be created on mobile
with their common fields + a starting price; Decor and the single-listing
categories (Mehendi/Makeup/Saree Draping, authored in onboarding) show a
"manage on the web" note.

**Phase 4 (money & notifications) core is in**:

- Booking flow — the couple booking screen (10% booking amount: 5% one vendor,
  4% booking all together, matching the web's incentive), book / book-all /
  cancel with the non-refundable warning, behind a `payBookingAmount()` seam
  (`src/lib/payments.ts`). Booking is simulated today (as the web app is); the
  seam is the single place real Razorpay drops in — a Supabase edge function
  creates the order server-side, then native/hosted checkout, then verify +
  Razorpay Route payout. No in-app purchase path for unlocks (iOS §3).
- Two-way milestone tracking — the couple `MilestoneTracker` (progress +
  timeline + mark-complete) reads/writes the same shared state the vendor
  advances from the Bookings screen.
- In-app notifications — couple + vendor lists off the shared `notifications`
  table (vendor from the store; couple fetched live with a demo fallback).
- Push — `expo-notifications` token registration into a new `push_tokens` table,
  plus a `send-push` Supabase edge function that fans each `notifications`
  insert out to the user's devices via Expo Push (wire it as a DB webhook on
  `notifications` INSERT). Registration no-ops in the web preview and Expo Go;
  it needs a dev build to actually receive pushes.
- Entitlement sync — the subscription tier re-reads from Supabase on every
  foreground, so a web unlock reflects in the app within a tab-switch.

### Backend deploy (push)

Two new files live in the shared `supabase/` dir (not app code):

- `supabase/047_push_tokens.sql` — `supabase db push` (or run in the SQL editor)
- `supabase/functions/send-push/` — `supabase functions deploy send-push`, then
  `supabase secrets set SB_URL=… SB_SERVICE_ROLE_KEY=…`, then add a Database
  Webhook: table `notifications`, event INSERT → Edge Function `send-push`.

**Real Razorpay gateway is in** (behind the `payBookingAmount()` seam):

- `create-razorpay-order` — makes the order server-side (secret never in the app).
- `razorpay-checkout` — a hosted checkout.js page opened via `expo-web-browser`;
  it redirects back to the app's `razorpay-callback` deep link with the result.
  Using the hosted widget means **no native Razorpay module**, so it runs in a
  dev build without ejecting.
- `verify-razorpay-payment` — verifies the payment signature (HMAC-SHA256) before
  the booking is recorded.

The flow activates only on a native build with `EXPO_PUBLIC_RAZORPAY_KEY_ID` set;
demo / web / unconfigured falls back to the simulated success, so the booking UI
is always exercisable.

**Deploy Razorpay:**

```
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
supabase functions deploy razorpay-checkout --no-verify-jwt   # loaded by the browser, no JWT
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx
```

Then set `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `mobile/.env` and build. Razorpay Route
(automatic vendor payout / split settlement) is the remaining server-side add-on.

### Not yet built

- **Razorpay Route** payout split (server-side settlement to vendors).
- **Phone / WhatsApp OTP** (MSG91), **vendor KYC**, and **PostGIS proximity
  matching** — the remaining plan "NEW" items.
- **Phase 5 — polish & launch**: offline handling, Sentry, in-app account
  deletion (Apple), store assets and submission.
- **Phase 5 — polish & launch**: offline handling, Sentry, in-app account
  deletion (required by Apple), store assets and submission

Not yet started and called out in the plan as new work rather than a port: phone
/ WhatsApp OTP login via MSG91, PostGIS proximity matching on the backend, vendor
KYC, and Razorpay Route payouts.
