-- ════════════════════════════════════════════
-- Vendor workflow: decline trial, packages, review responses
-- ════════════════════════════════════════════

-- ─── TRIALS — allow 'declined' status ────────
-- Existing check constraint was: status in ('requested', 'accepted', 'rescheduled', 'confirmed', 'done')
-- We need to also allow 'declined' so vendors can reject a trial outright.
alter table trials drop constraint if exists trials_status_check;
alter table trials add constraint trials_status_check
  check (status in ('requested', 'accepted', 'rescheduled', 'confirmed', 'done', 'declined'));

-- Store the reason vendor gave when declining (optional)
alter table trials add column if not exists decline_reason text;

-- ─── VENDOR PACKAGES ────────────────────────
-- Pre-defined service tiers a vendor offers (Standard, Premium, etc.).
-- Each booking can be tagged with which package was sold.
create table if not exists vendor_packages (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  name text not null,
  price integer not null,
  capacity text,
  features jsonb default '[]'::jsonb,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendor_packages enable row level security;
create policy "Vendors can manage own packages" on vendor_packages for all
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
create policy "Anyone can read packages" on vendor_packages for select using (true);

-- ─── REVIEWS — vendor response ──────────────
-- Let vendors reply publicly to reviews left by couples.
alter table reviews add column if not exists vendor_response text;
alter table reviews add column if not exists vendor_responded_at timestamptz;

-- Vendor must be able to update the response field on their own reviews
create policy "Vendors can respond to their reviews" on reviews for update
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
