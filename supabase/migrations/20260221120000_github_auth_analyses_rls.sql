-- GitHub OAuth token storage (server access via service role only; RLS blocks direct client access).
create table if not exists public.user_github_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_access_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_github_tokens enable row level security;

-- No policies: anon/authenticated cannot read/write; service role bypasses RLS.

-- Analyses: optional owner for private runs; null = guest/public artifact.
alter table public.analyses
  add column if not exists user_id uuid references auth.users (id);

create index if not exists analyses_user_id_idx on public.analyses (user_id);

alter table public.analyses enable row level security;

-- Guests (no JWT): only rows with no owner. Signed-in: those plus own rows.
drop policy if exists "analyses_select_public_or_own" on public.analyses;
create policy "analyses_select_public_or_own"
  on public.analyses
  for select
  to anon, authenticated
  using (user_id is null or auth.uid() = user_id);

-- Writes remain via service role from API routes (bypasses RLS).

grant select on public.analyses to anon, authenticated;
