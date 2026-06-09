-- ════════════════════════════════════════════
-- Couple's Mehendi selection per board category
-- ════════════════════════════════════════════
-- When a couple configures a mehendi vendor (bridal coverage + design, groom,
-- guest count) we store it on the board category so the card price and totals
-- reflect their choice. Stored as jsonb:
--   { "coverage": "Both Hands & Legs", "design": "Arabic", "groom": true, "guests": 10 }

alter table board_categories
  add column if not exists mehendi_selection jsonb;
