-- ════════════════════════════════════════════
-- Couple's menu dish picks per board category
-- ════════════════════════════════════════════
-- When a couple picks dishes from a caterer's / venue's menu we save it so it
-- survives refresh. Stored per vendor + per package + per section as jsonb:
--   { "<vendorId>": { "<packageId|'listing'>": { "<section>": [dishId|"custom name", ...] } } }
--
-- Additive. Idempotent. Run AFTER 036_profiles_role_optional.sql

alter table board_categories
  add column if not exists menu_selection jsonb;
