-- ════════════════════════════════════════════
-- Photography event-based packages (third pricing model)
-- ════════════════════════════════════════════
-- Photography already supports `hourly` (rate_card) and `guestBased`
-- (guest_packages). This adds a third model, `eventBased`, chosen via
-- `photography_pricing_models` (e.g. ["eventBased"] or combined with the others):
--   • eventBased → `event_packages`: an array of pricing cards. Each card is
--       { id, events: string[], prices: { <serviceKey>: number } }
--     where events are RITUALS values and/or custom-added strings, and prices
--     hold a FLAT ₹ per service (traditionalPhotography, traditionalVideography,
--     candidPhotography, candidVideography, ledScreens, drone, album,
--     liveStreaming) for the whole event — not per hour, not multiplied per event.
--
-- IMPORTANT: insertListing()/updateListingDb() ALWAYS write this column for EVERY
-- category (not just Photography). If it doesn't exist, every listing write fails
-- outright. The guard is IF NOT EXISTS, so this is safe to run on prod too.

alter table vendor_listings
  add column if not exists event_packages jsonb default '[]'::jsonb;
