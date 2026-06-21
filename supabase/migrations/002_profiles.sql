-- SceneOne: profiles table for writer + exec accounts
-- Run in the Supabase SQL editor at app.supabase.com

create table if not exists profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  role         text        not null default 'writer' check (role in ('writer', 'exec')),
  display_name text,
  company      text,
  title        text,        -- "Director", "Development Executive", "Producer", etc.
  imdb_url     text,
  credits      text,        -- free-text credits / bio
  verified     boolean     default false,
  credits_json jsonb        default '{}'::jsonb  -- future: structured credit objects
);

-- Index for role lookups
create index if not exists profiles_role_idx on profiles (role);

-- Row-level security
alter table profiles enable row level security;

-- Anyone authenticated can read profiles (execs need to see writer profiles + vice versa)
create policy "Authenticated users can read profiles" on profiles
  for select using (auth.role() = 'authenticated');

-- Users can only insert their own profile
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
