-- ════════════════════════════════════════════
-- Mehendi pricing (single-listing category)
-- ════════════════════════════════════════════
-- Mehendi listings are authored in vendor onboarding (not as a separate listing)
-- and store their pricing as jsonb:
--   { "bridalOffered": true,
--     "bridal": { "2 Hands": { "Minimal": 5000, "Arabic": 8000, "Heavy Bridal": 15000 }, ... },
--     "groomPrice": 3000, "guestPricePerPerson": 500 }
-- The listing's `price` column holds the cheapest bridal "from" price.

alter table vendor_listings
  add column if not exists mehendi_pricing jsonb default '{}'::jsonb;
