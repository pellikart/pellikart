-- ════════════════════════════════════════════
-- Razorpay Route: vendor payout accounts + payouts
-- Run after the earlier migrations.
-- ════════════════════════════════════════════
--
-- Route pays vendors automatically by splitting the booking payment: the
-- couple's 10% booking amount is captured into Pellikart's Razorpay account and
-- a share (booking amount − platform commission) is transferred to the vendor's
-- LINKED ACCOUNT, held until a milestone completes, then released.
--
--   vendor_payout_accounts — one Razorpay linked account per vendor (their KYC +
--     bank). Created via the create-linked-account edge function.
--   vendor_payouts — one row per Route transfer: which booking/vendor, the
--     Razorpay transfer id, the amount, and whether it's still held or released.

create table if not exists vendor_payout_accounts (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade unique not null,
  -- Razorpay linked account id, e.g. "acc_XXXXXXXX".
  razorpay_account_id text unique,
  -- created | activation_pending | activated | needs_action
  status text not null default 'activation_pending',
  beneficiary_name text,
  -- Last 4 of the settlement bank account, for display only (never the full number).
  bank_last4 text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vendor_payout_accounts enable row level security;

create policy "Vendors read own payout account"
  on vendor_payout_accounts for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
-- Inserts/updates go through the edge functions (service role), not the client.

create table if not exists vendor_payouts (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  -- Links to the booking once known; nullable because the transfer is recorded
  -- at payment time, which may precede the booking row.
  booking_id uuid,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_transfer_id text unique,
  amount integer not null,               -- vendor's share, in paise
  -- held | released | reversed | failed
  status text not null default 'held',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists vendor_payouts_vendor_id_idx on vendor_payouts (vendor_id);
create index if not exists vendor_payouts_booking_id_idx on vendor_payouts (booking_id);

alter table vendor_payouts enable row level security;

create policy "Vendors read own payouts"
  on vendor_payouts for select
  using (vendor_id in (select id from vendors where user_id = auth.uid()));
-- Writes are service-role only (edge functions).

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists vendor_payout_accounts_touch on vendor_payout_accounts;
create trigger vendor_payout_accounts_touch
  before update on vendor_payout_accounts
  for each row execute procedure public.touch_updated_at();

drop trigger if exists vendor_payouts_touch on vendor_payouts;
create trigger vendor_payouts_touch
  before update on vendor_payouts
  for each row execute procedure public.touch_updated_at();
