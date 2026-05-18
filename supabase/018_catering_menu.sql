-- ════════════════════════════════════════════
-- Catering listing curated menu
-- ════════════════════════════════════════════
-- Stored as a jsonb array of section objects:
--   [{ section: string, dishIds: number[], pickLimit: number }, ...]
-- dishIds reference the static DISH_BANK in src/lib/dish-bank.ts (seeded
-- from Pellikart_Dish_Bank.xlsx). pickLimit caps how many dishes a couple
-- can pick from that section.

alter table vendor_listings
  add column if not exists menu jsonb default '[]'::jsonb;
