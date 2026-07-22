-- ════════════════════════════════════════════
-- Board: couple's event-based Photography selection
-- ════════════════════════════════════════════
-- The couple side surfaces each Photography event package as its own listing
-- (see store.expandEventPackageListings). When a couple picks one, they tick the
-- services they want; that selection is stored on the board category alongside
-- the existing photography_team (hourly) and photography_package (guest-based)
-- selections:
--   photography_event_selection = { "services": ["candidPhotography", "drone", ...] }
--
-- Guard is IF NOT EXISTS, so this is safe to run on prod.

alter table board_categories
  add column if not exists photography_event_selection jsonb;
