-- Baseline table for dashboard-persisted analysis reports (greenfield DB).
-- See apps/dashboard/app/api/analyze/route.ts upsert and app/api/results/[id]/route.ts.

create table if not exists public.analyses (
  result_id text primary key,
  repo_url text not null,
  commit_sha text,
  report_json jsonb not null,
  analyzed_at timestamptz not null default now()
);

create index if not exists analyses_analyzed_at_idx on public.analyses (analyzed_at desc);
