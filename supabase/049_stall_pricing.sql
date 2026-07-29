-- ════════════════════════════════════════════
-- Live Stalls pricing (per-listing)
-- ════════════════════════════════════════════
-- Live Stalls price in one of two mutually-exclusive ways, stored as jsonb:
--   { "mode": "package" }                         -- flat price (listing.price)
--   { "mode": "perItem",                          -- per-guest items × guests
--     "items": [ { "id": "stl-...", "name": "Bangle set", "pricePerGuest": 150 }, ... ] }
-- For perItem stalls, the listing's `price` column holds the cheapest per-guest
-- item rate (the "from" figure shown on the board card).

alter table vendor_listings
  add column if not exists stall_pricing jsonb default '{}'::jsonb;
