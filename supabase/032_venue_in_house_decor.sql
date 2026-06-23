-- ════════════════════════════════════════════
-- Venue in-house decor
-- ════════════════════════════════════════════
-- Stored as a jsonb object on the venue listing:
--   { compulsory: bool, pending?: bool, fields?: {...}, designs?: [{ id, name, photos[], videos[], price, sizes? }] }
-- compulsory = couples booking this venue must take the in-house decor.
-- pending    = compulsory but the vendor skipped adding details (reminder shown).

alter table vendor_listings
  add column if not exists in_house_decor jsonb default '{}'::jsonb;
