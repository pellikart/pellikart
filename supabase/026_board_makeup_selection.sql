-- ════════════════════════════════════════════
-- Couple's Makeup selection per board category
-- ════════════════════════════════════════════
-- When a couple configures a makeup vendor (which bridal events, groom, guest
-- count) we store it on the board category so the card price and totals reflect
-- their choice. Stored as jsonb:
--   { "events": ["Engagement", "Pelli (Wedding)"], "groom": true, "guests": 5 }

alter table board_categories
  add column if not exists makeup_selection jsonb;
