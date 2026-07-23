-- ════════════════════════════════════════════
-- Hosts / Entertainers event-based pricing
-- ════════════════════════════════════════════
-- Hosts/Entertainers price a FLAT rate per event (unlike Photography's per-service
-- cards). This stores the whole pricing object in one jsonb column:
--   entertainer_pricing = {
--     eventRates: [ { id, event, price } ],   -- event = RITUALS value or custom string
--     durationHours?: number,                 -- performance duration (informational)
--     additionalHourCharge?: number,          -- ₹ per extra hour
--     languages?: string[]                    -- Hindi / Telugu / English (+ custom)
--   }
-- On the couple side each priced event is fanned into its own ritual-matched
-- listing (store.expandEntertainerListings), mirroring the Photography fan-out.
--
-- IMPORTANT: insertListing()/updateListingDb() ALWAYS write this column for EVERY
-- category (not just Hosts/Entertainers). If it doesn't exist, every listing write
-- fails outright. The guard is IF NOT EXISTS, so this is safe to run on prod too.

alter table vendor_listings
  add column if not exists entertainer_pricing jsonb default '{}'::jsonb;
