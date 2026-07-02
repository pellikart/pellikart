-- ════════════════════════════════════════════
-- Admin-assisted vendor onboarding + claim flow
--
-- Lets Pellikart staff pre-build real, live vendor profiles (from quotations
-- we already hold) WITHOUT the vendor having an account yet. The vendor later
-- logs in with Google and "claims" the profile using a code and/or their phone,
-- which transfers ownership by setting vendors.user_id = their auth uid.
--
-- Safe + additive: the only structural change is making vendors.user_id
-- nullable. No existing data is touched. Idempotent — safe to re-run.
--
-- Run this AFTER 034_photography_guest_packages.sql
-- ════════════════════════════════════════════

-- ─── ADMINS ALLOWLIST ───────────────────────
-- Who is allowed to create/edit admin vendor rows. Enforced by RLS via is_admin().
create table if not exists admins (
  email text primary key,
  created_at timestamptz default now()
);

-- Seed the founder. Add more admins with:  insert into admins (email) values ('someone@x.com');
insert into admins (email) values ('dussalalith@gmail.com')
  on conflict (email) do nothing;

alter table admins enable row level security;

-- ─── is_admin() HELPER ──────────────────────
-- True when the current JWT's email is in the admins allowlist. Used by every
-- admin RLS policy below. security definer so it bypasses `admins` RLS.
-- Defined before the policies that reference it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = (auth.jwt() ->> 'email')
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- is_admin() is security definer, so it can read `admins` regardless of this
-- table's own RLS — keeping the allowlist itself private to admins.
drop policy if exists "Admins can read admins" on admins;
create policy "Admins can read admins" on admins for select using (public.is_admin());

-- ─── VENDORS: allow admin-created, unclaimed rows ───
-- user_id becomes nullable so a vendor row can exist before any auth user owns
-- it. Postgres allows multiple NULLs under the existing UNIQUE(user_id).
alter table vendors alter column user_id drop not null;

alter table vendors add column if not exists claim_code text;
alter table vendors add column if not exists claim_phone text;
alter table vendors add column if not exists is_admin_created boolean default false;
alter table vendors add column if not exists claimed_at timestamptz;

-- Claim codes must be unique so a code maps to exactly one vendor.
create unique index if not exists vendors_claim_code_key
  on vendors (claim_code) where claim_code is not null;

-- Phone lookups for the claim flow.
create index if not exists vendors_claim_phone_idx
  on vendors (claim_phone) where claim_phone is not null;

-- ─── ADMIN RLS POLICIES ─────────────────────
-- Permissive policies OR'd on top of the existing owner/public policies, so
-- admins can fully manage vendor data (including rows with user_id = NULL)
-- using only their normal authenticated session — no service-role key needed.
drop policy if exists "Admins manage all vendors" on vendors;
create policy "Admins manage all vendors" on vendors for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage all listings" on vendor_listings;
create policy "Admins manage all listings" on vendor_listings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage all availability" on vendor_availability;
create policy "Admins manage all availability" on vendor_availability for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage all packages" on vendor_packages;
create policy "Admins manage all packages" on vendor_packages for all
  using (public.is_admin()) with check (public.is_admin());

-- ─── STORAGE: admins can upload/delete any vendor photo ───
drop policy if exists "Admins can upload vendor photos" on storage.objects;
create policy "Admins can upload vendor photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'vendor-photos' and public.is_admin());

drop policy if exists "Admins can delete vendor photos" on storage.objects;
create policy "Admins can delete vendor photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'vendor-photos' and public.is_admin());

-- ─── claim_vendor() ─────────────────────────
-- Called by a freshly-logged-in vendor to take ownership of a profile we
-- pre-built. Matches an unclaimed admin-created vendor by claim code OR phone,
-- sets user_id to the caller, and flips their profile role to 'vendor'.
-- security definer so it can bypass RLS to perform the one-time transfer.
create or replace function public.claim_vendor(p_code text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Treat empty strings as absent.
  if p_code = '' then p_code := null; end if;
  if p_phone = '' then p_phone := null; end if;

  if p_code is null and p_phone is null then
    raise exception 'Provide a claim code or phone number';
  end if;

  -- One account can own only one vendor (matches UNIQUE(user_id)).
  if exists (select 1 from vendors where user_id = auth.uid()) then
    raise exception 'This account already has a vendor profile';
  end if;

  -- Find matching unclaimed rows; v_count = total matches (window over full set).
  select id, cnt into v_id, v_count from (
    select id, count(*) over () as cnt
    from vendors
    where is_admin_created = true
      and user_id is null
      and (
        (p_code is not null and claim_code = p_code)
        or (p_phone is not null and claim_phone = p_phone)
      )
  ) m
  limit 1;

  if v_id is null then
    raise exception 'No matching profile found. Check your code or phone number.';
  end if;

  -- A phone shared by multiple pending profiles is ambiguous — require the code.
  if v_count > 1 then
    raise exception 'Multiple profiles match — please use your claim code.';
  end if;

  update vendors
    set user_id = auth.uid(),
        claimed_at = now(),
        updated_at = now()
    where id = v_id;

  update profiles set role = 'vendor', updated_at = now() where id = auth.uid();

  return v_id;
end;
$$;

grant execute on function public.claim_vendor(text, text) to authenticated;
