-- ════════════════════════════════════════════
-- Venue listing hourly pricing tiers
-- ════════════════════════════════════════════
-- Venues often charge differently for 12 hr / 24 hr / custom rental durations.
-- Stored as a jsonb array of { hours: number, price: number } objects so
-- vendors can list as many tiers as they want without a tiers table.

alter table vendor_listings
  add column if not exists hourly_pricing jsonb default '[]'::jsonb;
