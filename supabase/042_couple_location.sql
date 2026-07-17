-- Couple home location captured (optionally) during onboarding.
-- Used to surface venues and vendors near the couple, and to measure the
-- straight-line distance from the couple to each venue ("X km away").
--   location          → human-readable locality / address label
--   location_lat/lng  → coordinates from the "use current location" button,
--                       paired with venue coordinates for the distance badge.
-- Run manually in Supabase.

alter table couples add column if not exists location text;
alter table couples add column if not exists location_lat double precision;
alter table couples add column if not exists location_lng double precision;
