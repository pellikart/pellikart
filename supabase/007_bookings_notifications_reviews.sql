-- ════════════════════════════════════════════
-- Bookings, Milestones, Notifications, Reviews, Earnings
-- ════════════════════════════════════════════

-- ─── BOOKINGS ───────────────────────────────

create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references profiles(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,
  listing_id text,
  ritual_board_id text,
  category_label text not null,
  total_value integer not null,
  slot_amount integer not null,
  slot_percentage integer not null default 5,
  status text check (status in ('active', 'completed', 'cancelled')) default 'active',
  booked_at timestamptz default now()
);

alter table bookings enable row level security;
create policy "Couples can manage own bookings" on bookings for all using (couple_id = auth.uid());
create policy "Vendors can read their bookings" on bookings for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));

-- ─── MILESTONES ─────────────────────────────

create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  title text not null,
  sort_order integer not null default 0,
  is_complete boolean default false,
  completed_at timestamptz
);

alter table milestones enable row level security;
create policy "Couples can manage own milestones" on milestones for all
  using (booking_id in (select id from bookings where couple_id = auth.uid()));
create policy "Vendors can read their milestones" on milestones for select
  using (booking_id in (
    select b.id from bookings b where b.vendor_id in (select id from vendors where user_id = auth.uid())
  ));
create policy "Vendors can update their milestones" on milestones for update
  using (booking_id in (
    select b.id from bookings b where b.vendor_id in (select id from vendors where user_id = auth.uid())
  ));

-- ─── NOTIFICATIONS ──────────────────────────

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null check (type in ('booking', 'trial', 'bid', 'milestone', 'review', 'system')),
  deep_link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;
create policy "Users can read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
-- Allow system to insert notifications for any user
create policy "Authenticated can insert notifications" on notifications for insert to authenticated with check (true);

-- ─── REVIEWS ────────────────────────────────

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references profiles(id) on delete cascade not null,
  vendor_id uuid references vendors(id) on delete cascade not null,
  booking_id uuid references bookings(id) on delete set null,
  couple_names text not null,
  event_name text not null,
  event_date text,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text,
  created_at timestamptz default now()
);

alter table reviews enable row level security;
create policy "Couples can manage own reviews" on reviews for all using (couple_id = auth.uid());
create policy "Vendors can read their reviews" on reviews for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
create policy "Anyone can read reviews" on reviews for select using (true);

-- ─── EARNINGS ───────────────────────────────

create table if not exists earnings (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  booking_id uuid references bookings(id) on delete set null,
  couple_names text not null,
  event_name text not null,
  amount integer not null,
  type text not null check (type in ('slot', 'milestone', 'final')),
  created_at timestamptz default now()
);

alter table earnings enable row level security;
create policy "Vendors can read own earnings" on earnings for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
create policy "System can insert earnings" on earnings for insert to authenticated with check (true);
