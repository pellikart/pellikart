-- ════════════════════════════════════════════
-- Vendor secondary phone number
-- ════════════════════════════════════════════
-- Optional second contact number captured during vendor onboarding.

alter table vendors
  add column if not exists secondary_phone text;
