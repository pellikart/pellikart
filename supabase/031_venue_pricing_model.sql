-- ════════════════════════════════════════════
-- Venue pricing model (rent vs per-plate)
-- ════════════════════════════════════════════
-- Venues can price in two ways, and may offer one or both:
--   - 'rent'     → conventional venue rental (uses hourly_pricing tiers)
--   - 'perPlate' → rent is free, food is charged per plate (uses plate_packages)
--
-- venue_pricing_models: which model(s) this venue offers, e.g. ['rent','perPlate'].
-- plate_packages: jsonb array of per-plate food tiers:
--   [{ id, name, pricePerPlate, minPlates? }, ...]

alter table vendor_listings
  add column if not exists venue_pricing_models text[] default '{}'::text[];

alter table vendor_listings
  add column if not exists plate_packages jsonb default '[]'::jsonb;
