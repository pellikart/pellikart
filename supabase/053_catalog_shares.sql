-- ════════════════════════════════════════════
-- Admin catalog share links (auto-expire in 5 days)
-- ════════════════════════════════════════════
-- An admin generates a tokenised link to share a full-details vendor catalog for
-- a category with a client (offline events). Every link auto-expires 5 days
-- after it's generated, so it can't quietly undermine the paywall if it
-- circulates.  /catalog/<token>  →  resolves to a category via resolve_catalog_share()
-- Run AFTER 052_board_pandit_selection.sql.

create table if not exists catalog_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  category text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table catalog_shares enable row level security;

-- Admins create / list with their normal authenticated session.
drop policy if exists "Admins manage catalog shares" on catalog_shares;
create policy "Admins manage catalog shares" on catalog_shares for all
  using (public.is_admin()) with check (public.is_admin());

-- Public resolves ONE share by its exact token via this security-definer RPC, so
-- anonymous clients can open a valid link WITHOUT being able to enumerate the
-- table / harvest tokens. Returns the category only while the link is unexpired.
create or replace function public.resolve_catalog_share(p_token text)
returns table (category text)
language sql
stable
security definer
set search_path = public
as $$
  select category from public.catalog_shares
  where token = p_token
    and expires_at > now()
$$;

grant execute on function public.resolve_catalog_share(text) to anon, authenticated;
