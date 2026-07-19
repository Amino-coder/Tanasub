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

-- RLS is enabled with NO policies below, which means: nobody using the
-- public anon key can read or write these tables at all, from anywhere --
-- not the browser, not a direct API call, nothing. All access goes through
-- our Next.js API routes, which use the SERVICE ROLE key (server-only env
-- var, never exposed to the browser) and enforce the app's own rules in
-- code -- e.g. only returning both people's answers once bothDone is true.
--
-- This is what actually protects the sensitive answers people give here.
-- Do NOT add "using (true)" policies back for these tables -- that would
-- let anyone with the anon key (which ships in the browser bundle) read
-- and overwrite every session's answers directly, bypassing the app
-- entirely, regardless of whether both partners have finished.
alter table sessions enable row level security;
alter table participants enable row level security;
