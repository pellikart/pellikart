-- ════════════════════════════════════════════
-- Pandit / Purohit pricing (per vendor_listing)
-- ════════════════════════════════════════════
-- A Purohit is priced as per-event cards, stored as jsonb:
--   { "cards": [
--       { "id": "pnd-1", "event": "Pelli (Wedding)",
--         "ritualsIncluded": ["Ganapati Pooja", "Muhurtham", "Saptapadi"],
--         "durationHours": 3, "durationVaries": true,
--         "people": 0, "purohits": 2, "transportIncluded": true, "price": 15000 },
--       ... ] }
-- The listing's `price` column holds the cheapest priced card (the "from" figure).
-- Like Banjantrilu, a Pandit is one listing per vendor (not fanned); its board
-- events are the union of its priced cards' events.

alter table vendor_listings
  add column if not exists pandit_pricing jsonb default '{}'::jsonb;
