-- Raw AI usage CSV upload (nullable; existing analyses unchanged).
alter table public.analyses
  add column if not exists ai_usage_csv text;

comment on column public.analyses.ai_usage_csv is
  'Raw uploaded ai_usage_trace.csv content, including optional message_text/token columns. Nullable.';
