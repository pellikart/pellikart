-- ════════════════════════════════════════════
-- Banjantrilu (traditional bands) event-based pricing
-- ════════════════════════════════════════════
-- Banjantrilu vendors price with one or more "pricing cards"; each card covers a
-- single event and holds the number of artists, the number of hours, and a flat
-- price. This stores the whole pricing object in one jsonb column:
--   banjantrilu_pricing = {
--     cards: [ { id, event, artists, hours, price } ]  -- event = RITUALS value or custom
--   }
-- On the couple side each priced card is fanned into its own ritual-matched
-- listing (store.expandBanjantriluListings), mirroring the Photography/Entertainer
-- fan-out (id suffix `::bmt::<cardId>`).
--
-- IMPORTANT: insertListing()/updateListingDb() ALWAYS write this column for EVERY
-- category (not just Banjantrilu). If it doesn't exist, every listing write fails
-- outright. The guard is IF NOT EXISTS, so this is safe to run on prod too.

alter table vendor_listings
  add column if not exists banjantrilu_pricing jsonb default '{}'::jsonb;
