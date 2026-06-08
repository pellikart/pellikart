-- ════════════════════════════════════════════
-- Couple's Photography rate-card selection per board category
-- ════════════════════════════════════════════
-- When a couple builds a photographer's team (how many people per role + shared
-- coverage hours), we store it on the board category so the board card price and
-- ritual total reflect their selection. Stored as jsonb:
--   { "counts": { "candidPhotographer": 2, "drone": 1 }, "hours": 8 }

alter table board_categories
  add column if not exists photography_team jsonb;
