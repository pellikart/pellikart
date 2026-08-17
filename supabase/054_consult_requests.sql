-- ════════════════════════════════════════════
-- Expert consult requests ("my board is ready — call me")
-- ════════════════════════════════════════════
-- Closes the loop on the couple side. Vendors aren't onboarded yet and we list
-- on their behalf, so a couple who has shortlisted their board has nobody to
-- transact with. Instead of a dead end, the board hands off to us: the couple
-- books a slot with a Pellikart expert, we get the lead — with a frozen snapshot
-- of exactly what they picked — and we work the rest offline.
--
-- Writes go through request_consult() (security definer, granted to anon too) so
-- a visitor in the public demo / landing flow can raise a lead without an
-- account, and so the table itself never needs a public insert policy.
--
-- Run AFTER 053_catalog_shares.sql.

create table if not exists consult_requests (
  id uuid primary key default gen_random_uuid(),

  -- Who. Both nullable: an anonymous visitor on the public demo can raise one.
  user_id uuid references auth.users(id) on delete set null,
  couple_id uuid references couples(id) on delete set null,

  -- Contact details as typed on the form — this is what we actually call.
  contact_name text,
  phone text not null,
  email text,

  -- Which board triggered it. Stored as plain text, not an FK: demo-mode board
  -- ids are local strings, and the snapshot is the thing we actually work from.
  board_id text,
  board_name text,

  -- When they'd like the call.
  preferred_date date,
  preferred_slot text,

  notes text,
  -- Where the request came from: 'board_ready' | 'help' | 'landing'.
  source text not null default 'board_ready',

  -- Frozen copy of the board at request time: picks, prices, gaps, total.
  -- Frozen deliberately — the couple keeps editing after they ask for the call,
  -- and the expert needs to see what they were looking at when they asked.
  snapshot jsonb not null default '{}'::jsonb,

  -- Our side of the loop.
  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'won', 'lost')),
  admin_notes text,
  scheduled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consult_requests_status_idx on consult_requests (status, created_at desc);
create index if not exists consult_requests_user_idx on consult_requests (user_id) where user_id is not null;

alter table consult_requests enable row level security;

-- Admins work the whole queue with their normal authenticated session.
drop policy if exists "Admins manage consult requests" on consult_requests;
create policy "Admins manage consult requests" on consult_requests for all
  using (public.is_admin()) with check (public.is_admin());

-- A couple can read back their own requests (the board shows "call requested").
-- Read-only: status is ours to move, and inserts go through the RPC below.
drop policy if exists "Couples read own consult requests" on consult_requests;
create policy "Couples read own consult requests" on consult_requests for select
  using (user_id = auth.uid());

-- ─── request_consult() ──────────────────────
-- The only way a request is created. security definer so anonymous visitors can
-- raise one without the table being publicly writable.
--
-- Idempotent-ish: re-submitting the same phone within 10 minutes returns the
-- existing open request instead of stacking duplicates in the queue (double
-- taps, and the "I filled it on the demo then again after signing in" case).
create or replace function public.request_consult(
  p_name text,
  p_phone text,
  p_email text,
  p_board_id text,
  p_board_name text,
  p_preferred_date date,
  p_preferred_slot text,
  p_notes text,
  p_source text,
  p_snapshot jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
  v_digits text;
  v_existing uuid;
  v_id uuid;
begin
  -- A callable number is the one thing a lead cannot be missing.
  v_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_digits) < 8 then
    raise exception 'A valid phone number is required';
  end if;

  if v_uid is not null then
    select id into v_couple_id from couples where user_id = v_uid;
  end if;

  -- Collapse rapid re-submits of the same number onto the open request.
  select id into v_existing
  from consult_requests
  where phone = p_phone
    and status in ('new', 'contacted')
    and created_at > now() - interval '10 minutes'
  order by created_at desc
  limit 1;

  if v_existing is not null then
    -- Keep the newest context rather than dropping it on the floor.
    update consult_requests
      set snapshot = coalesce(p_snapshot, snapshot),
          notes = coalesce(nullif(trim(p_notes), ''), notes),
          preferred_date = coalesce(p_preferred_date, preferred_date),
          preferred_slot = coalesce(nullif(trim(p_preferred_slot), ''), preferred_slot),
          user_id = coalesce(user_id, v_uid),
          couple_id = coalesce(couple_id, v_couple_id),
          updated_at = now()
      where id = v_existing;
    return v_existing;
  end if;

  insert into consult_requests (
    user_id, couple_id, contact_name, phone, email,
    board_id, board_name, preferred_date, preferred_slot,
    notes, source, snapshot
  ) values (
    v_uid, v_couple_id, nullif(trim(coalesce(p_name, '')), ''), p_phone,
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_board_id, '')), ''), nullif(trim(coalesce(p_board_name, '')), ''),
    p_preferred_date, nullif(trim(coalesce(p_preferred_slot, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(nullif(trim(coalesce(p_source, '')), ''), 'board_ready'),
    coalesce(p_snapshot, '{}'::jsonb)
  )
  returning id into v_id;

  -- Receipt in the couple's own notification feed, so the ask is visibly
  -- registered rather than vanishing into a form.
  if v_uid is not null then
    insert into notifications (user_id, title, body, type, deep_link)
    values (
      v_uid,
      'Expert call requested',
      'A Pellikart expert will call you to confirm your slot and take your board forward.',
      'system',
      '/'
    );
  end if;

  return v_id;
end;
$$;

grant execute on function public.request_consult(
  text, text, text, text, text, date, text, text, text, jsonb
) to anon, authenticated;
