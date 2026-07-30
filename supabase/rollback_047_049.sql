-- ────────────────────────────────────────────
-- ROLLBACK for migrations 047–049.
-- Run ONLY to undo those migrations. Drops exactly the objects they created —
-- and nothing else, so no pre-existing data is affected. (Dropping the geo
-- column removes only the derived coordinates it backfilled.)
-- ────────────────────────────────────────────

-- 049 — PostGIS matching
drop function if exists public.listings_near(double precision, double precision, text, double precision, integer);
drop trigger if exists vendor_listings_geo on vendor_listings;
drop function if exists public.sync_listing_geo();
drop index if exists vendor_listings_geo_idx;
alter table vendor_listings drop column if exists geo;
-- (PostGIS extension left installed — harmless, and other things may use it.)

-- 048 — Route payouts (dropping the tables also drops their triggers/policies)
drop table if exists vendor_payouts;
drop table if exists vendor_payout_accounts;

-- 047 — push tokens
drop table if exists push_tokens;
drop function if exists public.touch_push_token();

-- Shared helper created in 048; safe to drop if nothing else uses it.
-- drop function if exists public.touch_updated_at();
