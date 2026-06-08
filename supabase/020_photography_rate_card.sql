-- ════════════════════════════════════════════
-- Photography per-hour rate card
-- ════════════════════════════════════════════
-- Photography listings are priced per hour, per role instead of as a single
-- package. Stored as a jsonb object keyed by role:
--   { "candidPhotographer": 3000, "candidVideographer": 3500,
--     "traditionalPhotographer": 2500, "traditionalVideographer": 3000,
--     "drone": 4000 }
-- A missing or 0 entry means the vendor doesn't offer that role. The couple picks
-- how many people per role plus one shared number of hours; the listing's `price`
-- column holds the per-hour total for 1 of each offered role (the board figure).

alter table vendor_listings
  add column if not exists rate_card jsonb default '{}'::jsonb;
