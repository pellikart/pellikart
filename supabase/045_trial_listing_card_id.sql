-- ════════════════════════════════════════════
-- Trials: full couple-facing card id (event-package support)
-- ════════════════════════════════════════════
-- trials.listing_id is a uuid FK to vendor_listings, so it can only hold the base
-- listing id. Photography event packages are surfaced as their own couple-facing
-- cards with a synthetic text id `<listingId>::evt::<pkgId>` (see
-- store.expandEventPackageListings). This text column stores that full card id so
-- a trial re-attaches to the exact card on reload (the trial key is built from it);
-- listing_id stays the base uuid for the FK / vendor-side resolution.
--
-- Guard is IF NOT EXISTS, so this is safe to run on prod.

alter table trials
  add column if not exists listing_card_id text;
