-- 047: Multi-vendor packages on the couple's event board.
-- Stores the packages a couple has added to a board as a jsonb snapshot array
-- (see ActivePackage in src/lib/types.ts). ritual_boards is already world-readable
-- (010), so shared boards render the package grouping too.
alter table ritual_boards
  add column if not exists active_packages jsonb default '[]'::jsonb;
