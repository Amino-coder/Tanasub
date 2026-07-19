-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('A','B')),
  nickname text not null default '',
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, role)
);

alter table sessions enable row level security;
alter table participants enable row level security;

-- MVP policy: anyone who has the session code (i.e. the link) can read/write.
-- There is no login, so the link itself is the access control -- keep this in mind:
-- anyone with the URL can see the report once both people finish.
create policy "public read sessions" on sessions for select using (true);
create policy "public insert sessions" on sessions for insert with check (true);

create policy "public read participants" on participants for select using (true);
create policy "public insert participants" on participants for insert with check (true);
create policy "public update participants" on participants for update using (true);
