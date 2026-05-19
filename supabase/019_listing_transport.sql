-- ════════════════════════════════════════════
-- Transport & logistics charge per listing
-- ════════════════════════════════════════════
-- Every listing now declares whether transport/logistics is bundled into
-- the price. When it's not, the extra charge is shown as a sub-line on
-- the couple side and folded into the ritual total.

alter table vendor_listings
  add column if not exists transport_included boolean;

alter table vendor_listings
  add column if not exists transport_extra integer;
