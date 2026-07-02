-- ════════════════════════════════════════════
-- Make role a deliberate choice (fix "everyone becomes a couple")
--
-- Previously every new account was stamped role='couple' at signup, so a vendor
-- who tapped "Log in" (or whose choice was lost in the OAuth round-trip) got
-- silently dropped into the couple side with no way out. Now a brand-new
-- account starts with NO role; the app shows the couple/vendor chooser and
-- persists whatever they pick. Existing users keep their role — unaffected.
--
-- Additive/relaxing only: no data changes. Idempotent.
-- Run this AFTER 035_admin_onboarding.sql
-- ════════════════════════════════════════════

-- Allow an "undecided" role (NULL) until the user actually picks.
alter table profiles alter column role drop not null;

-- Relax the check so NULL is permitted alongside the two real roles.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role is null or role in ('couple', 'vendor'));

-- New accounts are created with NO role; the app forces a choice on first login
-- and saves it. (Was: values (new.id, 'couple').)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, null);
  return new;
end;
$$ language plpgsql security definer;
