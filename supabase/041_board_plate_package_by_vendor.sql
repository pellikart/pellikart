-- ════════════════════════════════════════════
-- Board: plate package chosen per venue (for comparison)
-- ════════════════════════════════════════════
-- Couples now pick a plate package when they ADD a per-plate venue to their
-- board, so every board venue carries a chosen package and the Compare table
-- can line them up package-vs-package. Stored as a jsonb map on the category:
--   { "<listing_id>": "<plate_package_id>", ... }
-- The selected (winning) venue's entry mirrors selected_plate_package_id.

alter table board_categories
  add column if not exists plate_package_by_vendor jsonb default '{}'::jsonb;
