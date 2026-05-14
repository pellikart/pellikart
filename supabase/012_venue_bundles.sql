-- ════════════════════════════════════════════
-- Venue-Decor-Catering bundles
-- ════════════════════════════════════════════
-- Some venues run their own in-house catering and decor and require the
-- couple to use them. The venue listing now points to those bundled
-- listing IDs, and a flag controls whether the bundle is mandatory.

alter table vendor_listings
  add column if not exists bundled_listings jsonb default '[]'::jsonb;

alter table vendor_listings
  add column if not exists bundle_mandatory boolean default false;
