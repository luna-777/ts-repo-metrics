-- Run in Supabase → SQL Editor (whole file), then retry Analyze.
-- Fixes: PGRST204 "Could not find the 'user_id' column of 'analyses' in the schema cache"

-- Baseline table (no-op if already present)
create table if not exists public.analyses (
  result_id text primary key,
  repo_url text not null,
  commit_sha text,
  report_json jsonb not null,
  analyzed_at timestamptz not null default now()
);

create index if not exists analyses_analyzed_at_idx on public.analyses (analyzed_at desc);

-- GitHub OAuth token storage
create table if not exists public.user_github_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_access_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_github_tokens enable row level security;

alter table public.analyses
  add column if not exists user_id uuid references auth.users (id);

create index if not exists analyses_user_id_idx on public.analyses (user_id);

alter table public.analyses enable row level security;

drop policy if exists "analyses_select_public_or_own" on public.analyses;
create policy "analyses_select_public_or_own"
  on public.analyses
  for select
  to anon, authenticated
  using (user_id is null or auth.uid() = user_id);

grant select on public.analyses to anon, authenticated;
