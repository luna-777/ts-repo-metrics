-- Research submission metadata (course flow). All nullable — existing analyses unchanged.
alter table public.analyses
  add column if not exists course_id    text,
  add column if not exists team_name    text,
  add column if not exists github_login text;

create index if not exists analyses_course_id_idx
  on public.analyses (course_id)
  where course_id is not null;
