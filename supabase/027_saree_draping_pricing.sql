-- ════════════════════════════════════════════
-- Saree Draping pricing (single-listing category)
-- ════════════════════════════════════════════
-- Saree Draping listings are authored in vendor onboarding and store pricing as
-- jsonb:
--   { "bridalPricePerLook": 3000, "groomPricePerLook": 2000, "guestPricePerPerson": 800 }
-- Bridal and groom (panche) are priced per look; guest is per guest. The listing's
-- `price` column holds the cheapest "from" price.

alter table vendor_listings
  add column if not exists saree_draping_pricing jsonb default '{}'::jsonb;
