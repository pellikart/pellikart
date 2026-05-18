-- ════════════════════════════════════════════
-- Couple's selected hourly tier per board category
-- ════════════════════════════════════════════
-- Tracks which rental duration (e.g. 12, 24 hours) the couple picked for
-- a venue that has hourly pricing tiers. Drives the ritual total + the
-- price shown on cards. Nullable when no tier is selected (or the vendor
-- doesn't offer hourly pricing).

alter table board_categories
  add column if not exists selected_tier_hours integer;
