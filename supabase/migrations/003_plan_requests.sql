-- SceneOne: plan enforcement, script requests, and missing columns
-- Run in the Supabase SQL editor at app.supabase.com

-- ── profiles: add plan + stripe fields ─────────────────────────────────────
alter table profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'writer', 'pro', 'pro_unlimited')),
  add column if not exists stripe_customer_id text,
  add column if not exists plan_expires_at timestamptz;

create index if not exists profiles_stripe_customer_idx on profiles (stripe_customer_id);

-- ── submissions: add missing columns ───────────────────────────────────────
alter table submissions
  add column if not exists public_listing boolean not null default false,
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Backfill user_id from auth.users where email matches (best effort)
update submissions s
set user_id = u.id
from auth.users u
where u.email = s.user_email
  and s.user_id is null;

-- Index for monthly analysis count queries (plan enforcement)
create index if not exists submissions_user_id_created_idx
  on submissions (user_id, created_at desc);

-- Index for discovery dashboard
create index if not exists submissions_public_listing_idx
  on submissions (public_listing, status, created_at desc)
  where public_listing = true and status = 'complete';

-- ── script_requests table ───────────────────────────────────────────────────
create table if not exists script_requests (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  exec_id        uuid        not null references auth.users(id) on delete cascade,
  submission_id  uuid        not null references submissions(id) on delete cascade,
  title          text,
  status         text        not null default 'pending'
                   check (status in ('pending','approved','declined','expired')),
  expires_at     timestamptz,
  unique (exec_id, submission_id)
);

create index if not exists script_requests_exec_idx on script_requests (exec_id);
create index if not exists script_requests_submission_idx on script_requests (submission_id);

alter table script_requests enable row level security;

-- Execs can insert and read their own requests
create policy "Exec can insert own requests" on script_requests
  for insert with check (auth.uid() = exec_id);

create policy "Exec can read own requests" on script_requests
  for select using (auth.uid() = exec_id);

-- Writers can read and respond to requests on their own scripts
create policy "Writer can read requests on own scripts" on script_requests
  for select using (
    exists (
      select 1 from submissions s
      where s.id = submission_id
        and s.user_email = auth.email()
    )
  );

create policy "Writer can update requests on own scripts" on script_requests
  for update using (
    exists (
      select 1 from submissions s
      where s.id = submission_id
        and s.user_email = auth.email()
    )
  );

-- ── Update submissions RLS to also allow upsert by user_id ─────────────────
-- (The existing policy allows insert by authenticated users)
-- Add an update policy that also covers upsert via our idempotency key
create policy if not exists "Users can upsert own submissions" on submissions
  for update using (auth.email() = user_email or auth.uid() = user_id);
