-- ════════════════════════════════════════════
-- Pellikart App Tables
-- Run this AFTER 001_profiles.sql
-- ════════════════════════════════════════════

-- ─── VENDORS ────────────────────────────────

create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  business_name text not null,
  category text not null,
  city text default 'Hyderabad',
  area text,
  phone text,
  whatsapp text,
  email text,
  description text,
  years_experience text,
  team_size text,
  category_fields jsonb default '{}'::jsonb,
  rating decimal(2,1) default 0,
  review_count integer default 0,
  is_live boolean default false,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendors enable row level security;
create policy "Vendors can manage own data" on vendors for all using (auth.uid() = user_id);
create policy "Anyone can read live vendors" on vendors for select using (is_live = true);

-- ─── VENDOR LISTINGS ────────────────────────

create table if not exists vendor_listings (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  name text not null,
  photos jsonb default '[]'::jsonb,
  category text not null,
  price integer not null,
  style text,
  rituals jsonb default '[]'::jsonb,
  category_fields jsonb default '{}'::jsonb,
  includes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendor_listings enable row level security;
create policy "Vendor owners can manage listings" on vendor_listings for all
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
create policy "Anyone can read listings" on vendor_listings for select using (true);

-- ─── VENDOR AVAILABILITY ────────────────────

create table if not exists vendor_availability (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('available', 'blocked', 'booked')) default 'available',
  listing_ids jsonb default '[]'::jsonb,
  blocked_ranges jsonb default '[]'::jsonb,
  unique(vendor_id, date)
);

alter table vendor_availability enable row level security;
create policy "Vendor owners can manage availability" on vendor_availability for all
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
create policy "Anyone can read availability" on vendor_availability for select using (true);

-- ─── COUPLES ────────────────────────────────

create table if not exists couples (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  partner1_name text,
  partner2_name text,
  events jsonb default '[]'::jsonb,
  custom_events jsonb default '[]'::jsonb,
  event_dates jsonb default '{}'::jsonb,
  event_guests jsonb default '{}'::jsonb,
  budget integer,
  style_preference text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table couples enable row level security;
create policy "Couples can manage own data" on couples for all using (auth.uid() = user_id);

-- ─── RITUAL BOARDS ──────────────────────────

create table if not exists ritual_boards (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references couples(id) on delete cascade not null,
  name text not null,
  date_start date,
  date_end date,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table ritual_boards enable row level security;
create policy "Couples can manage own boards" on ritual_boards for all
  using (couple_id in (select id from couples where user_id = auth.uid()));

-- ─── BOARD CATEGORIES ───────────────────────

create table if not exists board_categories (
  id uuid default gen_random_uuid() primary key,
  ritual_board_id uuid references ritual_boards(id) on delete cascade not null,
  label text not null,
  selected_vendor_id text,
  shortlisted_vendor_ids jsonb default '[]'::jsonb,
  suggested_vendors jsonb default '[]'::jsonb,
  is_removed boolean default false,
  unique(ritual_board_id, label)
);

alter table board_categories enable row level security;
create policy "Couples can manage own categories" on board_categories for all
  using (ritual_board_id in (
    select rb.id from ritual_boards rb
    join couples c on rb.couple_id = c.id
    where c.user_id = auth.uid()
  ));

-- ─── VENDOR LIKES ───────────────────────────

create table if not exists vendor_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  vendor_id text not null,
  liker_name text not null,
  liker_user_id text not null,
  created_at timestamptz default now(),
  unique(user_id, vendor_id, liker_user_id)
);

alter table vendor_likes enable row level security;
create policy "Users can manage own likes" on vendor_likes for all using (auth.uid() = user_id);
