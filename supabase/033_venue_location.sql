-- ════════════════════════════════════════════
-- Venue location
-- ════════════════════════════════════════════
-- Stored as a jsonb object on the venue listing:
--   { address, area?, city?, mapsLink? }

alter table vendor_listings
  add column if not exists venue_location jsonb default '{}'::jsonb;
