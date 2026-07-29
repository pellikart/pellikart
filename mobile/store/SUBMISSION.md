# Pellikart — App Store & Play submission

Everything needed to build, submit, and pass review. Items marked **[you]**
need your accounts/credentials.

## App identity

| | |
|---|---|
| Name | Pellikart |
| iOS bundle id | `com.pellikart.app` |
| Android package | `com.pellikart.app` |
| Version | `1.0.0` (build number auto-incremented by EAS) |
| Category | Lifestyle |

## Build & submit (EAS)

```
npm i -g eas-cli
eas login                      # [you] Expo account
eas init                       # writes the EAS projectId into app.json
eas build --profile production --platform all
eas submit --profile production --platform ios       # [you] fill eas.json ios ids
eas submit --profile production --platform android   # [you] google-service-account.json
```

`eas.json` has `development` / `preview` / `production` profiles. Fill the
`submit.production` placeholders (Apple ID, ASC app id, team id; Google service
account JSON) before submitting.

## Assets

- **App icon** — `assets/icon.png` (present). Confirm it's 1024×1024, no alpha,
  for the store.
- **Adaptive icon** (Android) — configured in `app.json`.
- **Splash** — configured via the `expo-splash-screen` plugin (logo on white).
- **Screenshots** — **[you]** capture per device size the stores require
  (6.7" + 6.5" iPhone; 7"/10" iPad if you keep tablet support; Android phone +
  tablet). Suggested screens: onboarding, event board, vendor discovery, vendor
  detail, booking, vendor dashboard.

## Required URLs — **[you]** host these

- **Privacy policy** — publish `store/legal/privacy-policy.md` at a public URL.
- **Terms of service** — publish `store/legal/terms-of-service.md`.
- **Support URL** — any reachable support/contact page.

Fill the `[DATE]`, `[CITY]`, and contact-email placeholders in both legal files
first.

## Store listing copy

**Subtitle / short description**
> Plan your wedding — discover, shortlist, and book vendors.

**Description**
> Pellikart brings your whole wedding plan into one place. Tell us your events,
> dates, guest count and budget, and we match you with venues, catering,
> photography, decor and more — near you and in your range. Shortlist together,
> compare, request visits and tastings, and lock a vendor's slot with a small
> booking amount. Track every booking through shared milestones, right up to the
> big day.
>
> For vendors: list your services, manage availability, respond to leads and
> visit requests, and get paid automatically for bookings.

**Keywords (iOS)**
> wedding, vendors, venue, catering, photographer, decor, planning, booking,
> shaadi, marriage

## Apple review notes (paste into App Review Information → Notes)

- **Demo accounts** — **[you]** create and provide:
  - Couple login (phone/OTP or Google) with a completed onboarding + a board.
  - Vendor login with a live listing.
  - A **pre-seeded booking** on the couple account so the reviewer can see the
    booking + milestone flow without paying.
  - If using phone OTP, either whitelist a test number with a fixed code in
    Supabase Auth, or provide a Google demo login instead.
- **Account deletion** (Guideline 5.1.1(v)) — supported in-app: Home / Profile →
  **Delete account** → confirm. Removes the account and data server-side.
- **Payments** (Guideline 3.1.1) — the only in-app payment is the **booking
  amount (10%) for a real-world service**, taken via Razorpay (UPI) — permitted
  outside IAP. There is **no in-app purchase of digital unlocks**; locked vendors
  simply appear locked, and the app does **not** link to or mention buying
  unlocks on the website. Keep it that way in any future change.
- **Encryption** — `ITSAppUsesNonExemptEncryption` is set to `false` (only
  standard HTTPS), so no export-compliance docs are needed.
- **Permissions** — location (nearby vendors) and photos (adding listing images)
  have usage strings in `app.json`.

## Google Play notes

- **Closed testing** — a new *personal* developer account must run a closed test
  with **12 testers for 14 continuous days** before production. Recruit testers
  early, or register an **organisation** account to avoid it.
- **Data safety form** — declare what the privacy policy lists (name, phone,
  email, location, financial info for vendor payouts; used for app
  functionality; not sold).
- **Financial features / permissions** — declare the payment feature; no
  restricted permissions are requested.

## Backend must be live before submitting

Deploy everything in `mobile/README.md` on the shared Supabase project:
migrations (push tokens, payouts, PostGIS), edge functions (push, Razorpay
order/verify/checkout, Route linked-account + release, MSG91 OTP hook,
delete-account), their secrets, the DB webhooks (notifications → push;
milestones → release), phone auth + the SMS hook, and Razorpay/MSG91/Sentry
keys. Set `mobile/.env` to the same project.

## Pre-submit smoke test (on a dev/preview build)

- [ ] Sign in by phone OTP and by Google
- [ ] Couple: onboarding → board → discover → detail → visit request → book →
      milestone
- [ ] Vendor: create/edit a listing, block a date, respond to a visit, view
      payouts
- [ ] Notifications arrive (push) for a booking
- [ ] Delete account works and returns to sign-in
- [ ] Offline banner appears with networking off
