-- =============================================================
-- CelebrateTogether — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================================

-- Profiles (extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  event_type text not null default 'birthday',
  recipient_name text not null,
  sender_name text not null,
  custom_message text not null,
  scheduled_at timestamptz not null,
  timezone text not null default 'UTC',
  theme text not null default 'joyful',
  music_preset text default 'none',
  photo_url text,
  share_slug text unique not null,
  is_active boolean not null default true,
  view_count integer not null default 0,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

-- Anyone can read active events (needed for the surprise link to work)
create policy "Anyone can read active events by slug"
  on public.events for select
  using (is_active = true);

-- Authenticated users can insert their own events
create policy "Auth users can create events"
  on public.events for insert
  with check (auth.uid() = creator_id or creator_id is null);

-- Auth users can update their own events
create policy "Auth users can update own events"
  on public.events for update
  using (auth.uid() = creator_id);

-- Allow anonymous view count increments
create policy "Allow view count update"
  on public.events for update
  using (true)
  with check (true);

-- Reactions
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  emoji text not null,
  message text,
  created_at timestamptz default now()
);

alter table public.reactions enable row level security;

-- Anyone can insert reactions
create policy "Anyone can react"
  on public.reactions for insert
  with check (true);

-- Event creator can see reactions
create policy "Creators can see reactions"
  on public.reactions for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (e.creator_id = auth.uid() or e.creator_id is null)
    )
  );

-- =============================================================
-- Live Celebration Features Additions
-- =============================================================

-- Add cake_flavor and additional_photos columns if not present
alter table public.events 
  add column if not exists cake_flavor text default 'chocolate',
  add column if not exists additional_photos text;

-- Wishes Table
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.wishes enable row level security;

-- Allow anyone to post a wish (for friends)
create policy "Anyone can insert wishes"
  on public.wishes for insert
  with check (true);

-- Allow anyone to view wishes (for the real-time board)
create policy "Anyone can read wishes"
  on public.wishes for select
  using (true);

