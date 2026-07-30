-- ════════════════════════════════════════════
-- Couple's Pandit selection per board category
-- ════════════════════════════════════════════
-- A couple can pick multiple of a Purohit's event cards (e.g. Wedding +
-- Satyanarayana Swami Vratham); the board total sums their prices. We store the
-- picked card ids on the board category as jsonb:
--   { "cardIds": ["pnd-1", "pnd-3"] }

alter table board_categories
  add column if not exists pandit_selection jsonb;
