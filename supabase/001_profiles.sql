-- Profiles table: stores role (couple/vendor) and subscription tier for each auth user
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('couple', 'vendor')),
  subscription_tier text check (subscription_tier in ('free', 'silver', 'gold')) default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'couple'); -- default role, updated during onboarding
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: users can only read/update their own profile
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
