-- ════════════════════════════════════════════
-- Analytics Events — tracks all couple-vendor interactions
-- ════════════════════════════════════════════

create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  -- The vendor being interacted with (resolved from listing → vendor)
  vendor_id uuid references vendors(id) on delete cascade not null,
  -- Optional: which specific listing was viewed/interacted with
  listing_id uuid references vendor_listings(id) on delete set null,
  -- The couple/user who performed the action (null for anonymous)
  actor_id uuid references profiles(id) on delete set null,
  -- Event type
  event_type text not null check (event_type in (
    'explore_impression', 'detail_view', 'profile_view', 'compare_view',
    'shortlist_add', 'shortlist_remove', 'like', 'unlike',
    'suggest', 'trial_request', 'vendor_select', 'booking'
  )),
  -- Optional metadata (e.g. ritual name, category, referrer)
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Index for fast vendor-scoped queries
create index if not exists idx_analytics_vendor_id on analytics_events(vendor_id);
create index if not exists idx_analytics_vendor_type on analytics_events(vendor_id, event_type);
create index if not exists idx_analytics_created_at on analytics_events(created_at);

-- RLS: vendors can read their own events, anyone authenticated can insert
alter table analytics_events enable row level security;

create policy "Vendors can read own analytics"
  on analytics_events for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));

create policy "Authenticated users can log events"
  on analytics_events for insert
  to authenticated
  with check (true);
