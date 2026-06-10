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

-- Row-level security: anyone can insert, only owner can read
alter table submissions enable row level security;

create policy "Anyone can insert" on submissions for insert with check (true);
create policy "Users can read own submissions" on submissions for select using (true);
