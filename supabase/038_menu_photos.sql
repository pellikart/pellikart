-- ════════════════════════════════════════════
-- Catering / plate-package menu photos
-- ════════════════════════════════════════════
-- Vendors with large menus (100+ items) can now upload photos of their menu
-- instead of building it dish-by-dish. `menu_mode` chooses which the couple
-- sees: 'items' (the interactive dish-bank picker, stored in `menu`) or
-- 'photos' (the uploaded images in `menu_photos`).
--
-- Per-plate package menu photos live inside the existing `plate_packages`
-- jsonb (each package gained menuPhotos + menuMode fields), so no column is
-- needed for those.

alter table vendor_listings
  add column if not exists menu_photos jsonb default '[]'::jsonb,
  add column if not exists menu_mode text default 'items';
