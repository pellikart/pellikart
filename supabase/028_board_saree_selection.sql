-- ════════════════════════════════════════════
-- Couple's Saree Draping selection per board category
-- ════════════════════════════════════════════
-- When a couple configures a saree-draping vendor (bridal looks, groom looks,
-- guest count) we store it on the board category so the card price and totals
-- reflect their choice. Stored as jsonb:
--   { "bridalLooks": 2, "groomLooks": 1, "guests": 8 }

alter table board_categories
  add column if not exists saree_selection jsonb;
