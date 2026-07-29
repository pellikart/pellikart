-- ════════════════════════════════════════════
-- Push notification device tokens (mobile)
-- Run after the earlier migrations.
-- ════════════════════════════════════════════
--
-- The mobile apps register each device's Expo push token here (see
-- mobile/src/lib/push.ts). The send-push edge function reads this table to fan a
-- notification out to all of a user's devices.

create table if not exists push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  token text not null unique,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists push_tokens_user_id_idx on push_tokens (user_id);

alter table push_tokens enable row level security;

-- A user can register/read/remove only their own device tokens.
create policy "Users manage own push tokens"
  on push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on re-registration (upsert on the token).
create or replace function public.touch_push_token()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists push_tokens_touch on push_tokens;
create trigger push_tokens_touch
  before update on push_tokens
  for each row execute procedure public.touch_push_token();
