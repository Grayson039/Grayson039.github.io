-- SceneOne: submissions table
-- Run this in the Supabase SQL editor at app.supabase.com

create table if not exists submissions (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  title        text        not null,
  user_email   text,
  script_text  text,        -- raw extracted text (optional long-term storage)
  result       jsonb,       -- full Claude JSON response
  status       text        default 'pending' check (status in ('pending','processing','complete','error')),
  error_msg    text
);

-- Index for looking up by email (future auth)
create index if not exists submissions_user_email_idx on submissions (user_email);

-- Row-level security
alter table submissions enable row level security;

-- Authenticated users can insert their own submissions
create policy "Authenticated insert" on submissions
  for insert with check (auth.role() = 'authenticated');

-- Users can only read their own submissions
create policy "Users can read own submissions" on submissions
  for select using (auth.email() = user_email);

-- Users can only update their own submissions
create policy "Users can update own submissions" on submissions
  for update using (auth.email() = user_email);
