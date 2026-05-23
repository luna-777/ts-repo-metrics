-- Documentation review agent output (nullable; existing analyses unchanged).
alter table public.analyses
  add column if not exists doc_review_json jsonb;

comment on column public.analyses.doc_review_json is
  'Documentation review agent output (classifications, reviews, consistency). Nullable.';
