alter table public.news
  add column if not exists headline_ur text,
  add column if not exists summary_short_ur text,
  add column if not exists urdu_translation_attempted_at timestamptz;