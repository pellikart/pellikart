-- ════════════════════════════════════════════
-- Hair Styling pricing (single-listing category)
-- ════════════════════════════════════════════
-- Hair Stylist listings are authored in vendor onboarding and store pricing as
-- jsonb (also used by Makeup artists who offer hairstyling as an add-on):
--   { "bridalPricePerLook": 3000, "groomPricePerLook": 1500, "guestPricePerPerson": 900 }
-- Bridal and groom are priced per look; guest is per guest. The listing's `price`
-- column holds the cheapest "from" price.

alter table vendor_listings
  add column if not exists hair_styling_pricing jsonb default '{}'::jsonb;
