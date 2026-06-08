-- ════════════════════════════════════════════
-- Photography "willing hours"
-- ════════════════════════════════════════════
-- Alongside the per-hour rate card, a Photography vendor declares which hour
-- blocks they're willing to work (e.g. [4, 6, 8, 10]). Couples pick their
-- coverage hours from this set. Stored as a jsonb array of integers.

alter table vendor_listings
  add column if not exists available_hours jsonb default '[]'::jsonb;
