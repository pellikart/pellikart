-- ════════════════════════════════════════════
-- Venue service time slots (moved from package → venue level)
-- ════════════════════════════════════════════
-- Slot timings (e.g. Morning 10 AM–3 PM, Evening 6–11 PM) were stored per
-- plate package, but they're almost always the same across a venue's packages.
-- They now live once at the venue (listing) level in `plate_slots`.
--
-- Existing per-package slots (inside the `plate_packages` jsonb) are left in
-- place; the app backfills them up to the venue level on read (resolveVenueSlots
-- in vendor-types.ts) until the listing is next saved, which writes the
-- consolidated set here and drops the per-package copies.

alter table vendor_listings
  add column if not exists plate_slots jsonb default '[]'::jsonb;
