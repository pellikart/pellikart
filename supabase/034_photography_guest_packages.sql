-- ════════════════════════════════════════════
-- Photography guest-based packages (dual pricing)
-- ════════════════════════════════════════════
-- Photography now supports TWO pricing models (mirroring venue rent/per-plate),
-- chosen via `photography_pricing_models` (e.g. ["hourly"], ["guestBased"], or
-- both):
--   • hourly     → existing per-role `rate_card` + `available_hours`.
--   • guestBased → `guest_packages`: a flat matrix keyed by guest bucket
--     ("<200" | "200-500" | "500-1000" | "1000+") × hours (4/6/8/10) → price.
--     `guest_package_photographers` / `guest_package_videographers` hold the
--     head-count present per bucket (informational only — no price impact).
--
-- IMPORTANT: insertListing()/updateListingDb() ALWAYS write these columns for
-- EVERY category (not just Photography). If they don't exist, every listing
-- write fails outright. This migration backfills the columns that were
-- previously added to prod by hand (no migration existed), so the schema is
-- reproducible and a fresh environment won't silently drop listing inserts.
-- All guards are IF NOT EXISTS, so this is safe to run on prod too.

alter table vendor_listings
  add column if not exists photography_pricing_models    jsonb default '[]'::jsonb,
  add column if not exists guest_packages                jsonb default '{}'::jsonb,
  add column if not exists guest_package_photographers    jsonb default '{}'::jsonb,
  add column if not exists guest_package_videographers    jsonb default '{}'::jsonb;

-- The couple's guest-based pick ({ bucket, hours }) is stored on the board
-- category alongside the other per-category selections.
alter table board_categories
  add column if not exists photography_package jsonb;
