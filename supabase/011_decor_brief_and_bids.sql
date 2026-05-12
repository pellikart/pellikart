-- ════════════════════════════════════════════
-- Decor brief on board_categories + category FK on bids
-- ════════════════════════════════════════════
-- The Decor customize flow lets a couple submit a brief (setting, coverage,
-- size, flowers, reference photo, notes) so vendors can quote accurately.
-- Brief lives on the board_categories row (one per category). Bids reference
-- the category so the vendor can fetch the brief.

alter table board_categories add column if not exists decor_brief jsonb;

alter table bids add column if not exists category_id uuid
  references board_categories(id) on delete set null;
