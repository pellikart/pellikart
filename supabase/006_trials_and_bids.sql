-- ════════════════════════════════════════════
-- Trials & Bids — two-way couple-vendor communication
-- ════════════════════════════════════════════

-- ─── TRIALS ─────────────────────────────────
-- Couple requests a trial → vendor accepts/proposes new time → couple confirms

create table if not exists trials (
  id uuid default gen_random_uuid() primary key,
  -- Who's involved
  couple_id uuid references profiles(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,
  listing_id uuid references vendor_listings(id) on delete set null,
  -- Context
  ritual_name text not null,
  category_label text not null,
  -- Status flow: requested → accepted/rescheduled → confirmed → done
  status text not null check (status in ('requested', 'accepted', 'rescheduled', 'confirmed', 'done')) default 'requested',
  -- Times
  requested_date text not null,
  requested_time text not null,
  scheduled_date text not null,
  scheduled_time text not null,
  vendor_proposed_date text,
  vendor_proposed_time text,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table trials enable row level security;

-- Couples can create and read their own trials
create policy "Couples can manage own trials" on trials for all
  using (couple_id = auth.uid());

-- Vendors can read and update trials for their vendor record
create policy "Vendors can read their trials" on trials for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));

create policy "Vendors can update their trials" on trials for update
  using (vendor_id in (select id from vendors where user_id = auth.uid()));

-- ─── BIDS ───────────────────────────────────
-- Couple uploads a design image → vendor submits a price + note → couple selects

create table if not exists bids (
  id uuid default gen_random_uuid() primary key,
  -- Who's involved
  couple_id uuid references profiles(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,
  -- Context
  ritual_name text not null,
  category_label text not null,
  -- The design image uploaded by the couple
  uploaded_image text not null,
  -- Status flow: pending → submitted → selected/not_selected
  status text not null check (status in ('pending', 'submitted', 'selected', 'not_selected')) default 'pending',
  -- Vendor's response
  bid_price integer,
  bid_note text,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table bids enable row level security;

-- Couples can create and read their own bids
create policy "Couples can manage own bids" on bids for all
  using (couple_id = auth.uid());

-- Vendors can read and update bids for their vendor record
create policy "Vendors can read their bids" on bids for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));

create policy "Vendors can update their bids" on bids for update
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
