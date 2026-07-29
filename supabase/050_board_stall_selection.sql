-- ════════════════════════════════════════════
-- Couple's Live Stall selection per board category
-- ════════════════════════════════════════════
-- For a per-item (× guests) stall, the couple ticks the items they want and sets
-- a guest count. We store it on the board category so the card price and totals
-- reflect their choice. Stored as jsonb:
--   { "itemIds": ["stl-...", "stl-..."], "guests": 250 }

alter table board_categories
  add column if not exists stall_selection jsonb;
