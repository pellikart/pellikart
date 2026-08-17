-- ════════════════════════════════════════════
-- One paywall: the ₹300 refundable unlock
-- ════════════════════════════════════════════
-- Silver (₹999) and Gold (₹1,999) are retired. There is now a single wall: a
-- ₹300 deposit that reveals vendor names, full profiles and addresses, and
-- starts the availability check. It's refundable and adjusted against the
-- booking, so it reads as a deposit rather than a fee.
--
-- Contact details are NOT part of it — those stay with us until a booking is
-- confirmed, so the couple's decision keeps running through Pellikart.
--
-- Nobody self-serves the unlock: there's no payment gateway in the app, so the
-- couple raises a request (a consult_requests row with source 'paid_unlock'),
-- we send a payment link, and an admin flips the unlock from the leads desk
-- once it's paid. That's why staff need write access to profiles below.
--
-- Run AFTER 054_consult_requests.sql.

-- ─── TIER VALUES ────────────────────────────
-- 'unlocked' joins the allowed set. The legacy values stay allowed so no
-- historical row is invalidated by this migration; the update below moves
-- anyone who already paid onto the new value, and they keep their access.
alter table profiles drop constraint if exists profiles_subscription_tier_check;
alter table profiles add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'unlocked', 'silver', 'gold'));

update profiles
  set subscription_tier = 'unlocked', updated_at = now()
  where subscription_tier in ('silver', 'gold');

-- ─── ADMIN ACCESS TO PROFILES ───────────────
-- The leads desk flips a couple's unlock once their ₹300 lands. Read access
-- comes with it so the desk can show the couple's current state rather than
-- guessing. Both are additive — the existing own-profile policies still apply.
drop policy if exists "Admins read all profiles" on profiles;
create policy "Admins read all profiles" on profiles for select
  using (public.is_admin());

drop policy if exists "Admins update all profiles" on profiles;
create policy "Admins update all profiles" on profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- ─── UNLOCK BOOKKEEPING ─────────────────────
-- Which lead paid, when we unlocked them, and what we collected. Kept on the
-- request rather than the profile: it's a record of a transaction we processed
-- by hand, and a couple can raise more than one over the life of a wedding.
alter table consult_requests add column if not exists unlock_paid boolean not null default false;
alter table consult_requests add column if not exists unlock_paid_at timestamptz;
alter table consult_requests add column if not exists unlock_amount integer;
