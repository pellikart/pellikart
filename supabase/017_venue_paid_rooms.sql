-- ════════════════════════════════════════════
-- Venue listing paid rooms (lodging)
-- ════════════════════════════════════════════
-- Stored as a jsonb array of room objects:
--   [{ id, sharing, price, amenities[], photos[] }, ...]
-- Vendors can list multiple room options per listing — even multiple rooms
-- at the same sharing capacity — each with their own photos and amenities.

alter table vendor_listings
  add column if not exists paid_rooms jsonb default '[]'::jsonb;
