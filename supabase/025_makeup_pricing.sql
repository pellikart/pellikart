-- ════════════════════════════════════════════
-- Makeup pricing (single-listing category)
-- ════════════════════════════════════════════
-- Makeup listings are authored in vendor onboarding and store pricing as jsonb:
--   { "bridalByEvent": { "Engagement": 8000, "Pelli (Wedding)": 15000, ... },
--     "groomPrice": 4000, "guestPricePerPerson": 1500 }
-- Bridal prices are per look, per event. The listing's `price` column holds the
-- cheapest "from" price.

alter table vendor_listings
  add column if not exists makeup_pricing jsonb default '{}'::jsonb;
