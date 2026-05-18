-- ════════════════════════════════════════════
-- Vendor portfolio videos + listing videos
-- ════════════════════════════════════════════
-- Vendors can attach videos alongside photos at two levels:
--   • vendors.portfolio_videos     — profile-level showreel
--   • vendor_listings.videos       — per-listing clips
-- Both are nullable jsonb arrays of public storage URLs, mirroring the
-- shape of portfolio_photos / photos.

alter table vendors
  add column if not exists portfolio_videos jsonb default '[]'::jsonb;

alter table vendor_listings
  add column if not exists videos jsonb default '[]'::jsonb;
