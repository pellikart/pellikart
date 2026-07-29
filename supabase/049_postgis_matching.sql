-- ════════════════════════════════════════════
-- PostGIS location-proximity matching
-- Run after the earlier migrations.
-- ════════════════════════════════════════════
--
-- The plan wants proximity matching computed IN THE DATABASE so web and mobile
-- return identical results, instead of each client running its own haversine.
-- This adds a spatial column to vendor_listings (kept in sync from the venue's
-- lat/lng in venue_location), a GIST index, and a listings_near() RPC that both
-- apps call to get listings ranked by real, DB-computed distance.
--
-- Only venue listings carry coordinates (venue_location), so those are what
-- listings_near ranks; other categories match on their existing (non-spatial)
-- fields in the app.

create extension if not exists postgis;

-- Spatial point for each venue listing (lon/lat, WGS84).
alter table vendor_listings add column if not exists geo geography(Point, 4326);

-- Backfill from the lat/lng already stored inside venue_location.
update vendor_listings
set geo = ST_SetSRID(
    ST_MakePoint((venue_location->>'lng')::double precision,
                 (venue_location->>'lat')::double precision), 4326)::geography
where geo is null
  and venue_location is not null
  and (venue_location->>'lat') is not null
  and (venue_location->>'lng') is not null;

-- Keep geo in sync whenever venue_location changes.
create or replace function public.sync_listing_geo()
returns trigger as $$
begin
  if new.venue_location is not null
     and (new.venue_location->>'lat') is not null
     and (new.venue_location->>'lng') is not null then
    new.geo := ST_SetSRID(
      ST_MakePoint((new.venue_location->>'lng')::double precision,
                   (new.venue_location->>'lat')::double precision), 4326)::geography;
  else
    new.geo := null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists vendor_listings_geo on vendor_listings;
create trigger vendor_listings_geo
  before insert or update of venue_location on vendor_listings
  for each row execute procedure public.sync_listing_geo();

create index if not exists vendor_listings_geo_idx on vendor_listings using gist (geo);

-- ─── Proximity RPC ──────────────────────────
-- Returns listings within p_radius_km of the couple, with the distance computed
-- server-side, ordered nearest-first. Optional category / max-price filters let
-- it double as the location arm of the matching algorithm.
create or replace function public.listings_near(
  p_lat double precision,
  p_lng double precision,
  p_category text default null,
  p_radius_km double precision default 100,
  p_max_price integer default null
)
returns table (
  id uuid,
  vendor_id uuid,
  category text,
  price integer,
  distance_km double precision
)
language sql
stable
as $$
  select
    l.id,
    l.vendor_id,
    l.category,
    l.price,
    ST_Distance(l.geo, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0
      as distance_km
  from vendor_listings l
  where l.geo is not null
    and (p_category is null or l.category = p_category)
    and (p_max_price is null or l.price <= p_max_price)
    and ST_DWithin(l.geo, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
  order by distance_km asc;
$$;

-- Listings are publicly readable (RLS on vendor_listings), so the RPC is safe to
-- expose to both anon and signed-in callers.
grant execute on function public.listings_near(double precision, double precision, text, double precision, integer)
  to anon, authenticated;
