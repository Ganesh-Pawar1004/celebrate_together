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
  custom_label text,
  recipient_name text not null,
  sender_name text not null,
  custom_message text not null,
  scheduled_at timestamptz not null,
  timezone text not null default 'UTC',
  theme text not null default 'joyful',
  music_preset text default 'none',
  custom_music_data text,
  cake_flavor text default 'chocolate',
  cake_type text default 'classic',
  candle_count integer,
  cake_topper text default 'candles',
  cake_decorations text default 'none',
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

-- Security Definer function to increment event view count safely (avoids permissive update RLS)
create or replace function public.increment_view_count(event_id uuid)
returns void as $$
begin
  update public.events
  set view_count = coalesce(view_count, 0) + 1
  where id = event_id;
end;
$$ language plpgsql security definer;


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

-- Add new columns if not present (run after initial schema creation)
alter table public.events 
  add column if not exists cake_flavor text default 'chocolate',
  add column if not exists cake_type text default 'classic',
  add column if not exists candle_count integer,
  add column if not exists cake_topper text default 'candles',
  add column if not exists cake_decorations text default 'none',
  add column if not exists additional_photos text,
  add column if not exists custom_music_data text,
  add column if not exists custom_label text;

-- Wishes Table
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null constraint chk_name_length check (char_length(name) <= 50),
  message text not null constraint chk_message_length check (char_length(message) <= 500),
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

-- =============================================================
-- OPTIONAL: Server-Side Rate Limiting Trigger (For Production)
-- Run this in Supabase if you want to block API spam on wishes.
-- It tracks client IP from Supabase headers and blocks inserts > 10 per min.
-- =============================================================
/*
-- 1. Create a table to track request counts by IP
create table if not exists public.rate_limits (
  ip_address text primary key,
  request_count integer not null default 1,
  last_request timestamptz default now()
);

-- 2. Create the rate limiter function
create or replace function public.check_wish_rate_limit()
returns trigger as $$
declare
  client_ip text;
  req_record record;
begin
  -- Retrieve client IP from request headers injected by Supabase
  client_ip := coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown_ip'
  );

  select * from public.rate_limits where ip_address = client_ip into req_record;

  if not found then
    insert into public.rate_limits (ip_address) values (client_ip);
  else
    if req_record.last_request > now() - interval '1 minute' then
      if req_record.request_count >= 10 then
        raise exception 'Too many requests. Please wait before submitting more wishes.';
      else
        update public.rate_limits
        set request_count = request_count + 1
        where ip_address = client_ip;
      end if;
    else
      update public.rate_limits
      set request_count = 1, last_request = now()
      where ip_address = client_ip;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 3. Bind function to wishes table
create or replace trigger trigger_check_wish_rate_limit
  before insert on public.wishes
  for each row execute procedure public.check_wish_rate_limit();
*/

-- =============================================================
-- STORAGE BUCKETS SETUP: celebration-music
-- Run this in your SQL Editor to set up the storage bucket
-- and configure public RLS access policies.
-- =============================================================
/*
-- 1. Insert celebration-music bucket definition
insert into storage.buckets (id, name, public) 
values ('celebration-music', 'celebration-music', true)
on conflict (id) do nothing;

-- 2. Allow public access to read/download audio files
create policy "Public Access" 
  on storage.objects for select 
  using (bucket_id = 'celebration-music');

-- 3. Allow anonymous/public uploads (creators uploading custom music)
create policy "Allow Anonymous Uploads" 
  on storage.objects for insert 
  with check (bucket_id = 'celebration-music');
*/


