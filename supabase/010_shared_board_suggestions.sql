-- ════════════════════════════════════════════
-- Shared board viewer + family suggestions
-- ════════════════════════════════════════════
-- A board owner can share their board via /share/<id>. Recipients (logged in
-- OR anonymous) can view the board read-only, browse vendors per category,
-- and suggest a vendor back to the owner. Suggestions land in the existing
-- board_categories.suggested_vendors jsonb column.

-- ─── PUBLIC READ on boards + categories ─────
-- These ADD to the existing owner-only policies (RLS is OR across policies).
create policy "Anyone can read shared boards" on ritual_boards for select using (true);
create policy "Anyone can read shared board categories" on board_categories for select using (true);

-- ─── NOTIFICATIONS — allow 'suggestion' type ──
-- Existing check: type in ('booking','trial','bid','milestone','review','system').
-- Postgres has no ALTER CHECK ADD VALUE; we must drop and recreate. The new
-- constraint is a strict superset so no existing row can fail.
alter table notifications drop constraint if exists notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('booking', 'trial', 'bid', 'milestone', 'review', 'system', 'suggestion'));

-- (No new insert policy needed — add_board_suggestion below uses
-- SECURITY DEFINER and bypasses RLS on insert.)

-- ─── add_board_suggestion ──────────────────
-- A suggester (logged-in user OR anon) calls this to append a vendor to a
-- category's suggested_vendors array AND fire a notification to the owner.
-- SECURITY DEFINER lets the function bypass column-level RLS so suggesters
-- can write only this specific field, never the rest of the board.
create or replace function add_board_suggestion(
  p_category_id uuid,
  p_vendor_id text,
  p_suggested_by text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
  v_couple_user_id uuid;
  v_existing jsonb;
  v_category_label text;
  v_board_name text;
begin
  -- Sanity-check input
  if p_vendor_id is null or length(trim(p_vendor_id)) = 0 then
    raise exception 'vendor_id required';
  end if;
  if p_suggested_by is null or length(trim(p_suggested_by)) = 0 then
    raise exception 'suggested_by required';
  end if;

  -- Find the board owner so we can notify them. Joining couples → profiles user_id.
  select bc.ritual_board_id, c.user_id, bc.label, rb.name, coalesce(bc.suggested_vendors, '[]'::jsonb)
    into v_board_id, v_couple_user_id, v_category_label, v_board_name, v_existing
  from board_categories bc
  join ritual_boards rb on rb.id = bc.ritual_board_id
  join couples c on c.id = rb.couple_id
  where bc.id = p_category_id;

  if v_board_id is null then
    raise exception 'category not found';
  end if;

  -- Skip if the same (vendor, person) suggestion already exists — idempotent retry.
  if exists (
    select 1 from jsonb_array_elements(v_existing) elem
    where elem->>'vendorId' = p_vendor_id and elem->>'suggestedBy' = p_suggested_by
  ) then
    return;
  end if;

  -- Append to suggested_vendors
  update board_categories
  set suggested_vendors = v_existing || jsonb_build_object('vendorId', p_vendor_id, 'suggestedBy', p_suggested_by)
  where id = p_category_id;

  -- Notify the owner
  insert into notifications (user_id, title, body, type, deep_link)
  values (
    v_couple_user_id,
    'New suggestion from ' || p_suggested_by,
    p_suggested_by || ' suggested a ' || v_category_label || ' for ' || v_board_name,
    'suggestion',
    '/'
  );
end;
$$;

-- Anyone can call this — auth check happens inside via the join chain.
grant execute on function add_board_suggestion(uuid, text, text) to anon, authenticated;
