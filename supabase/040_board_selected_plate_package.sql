-- ════════════════════════════════════════════
-- Board selection: which plate package the couple picked
-- ════════════════════════════════════════════
-- When a couple adds a per-plate venue to their board they now pick one
-- specific plate package (e.g. "Veg Silver") rather than the whole venue, so
-- the vendor knows exactly which package the client wants. The chosen package
-- id is stored per board category alongside selected_vendor_id.

alter table board_categories
  add column if not exists selected_plate_package_id text;
