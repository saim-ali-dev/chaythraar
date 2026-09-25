alter table public.news
  add column if not exists headline text,
  add column if not exists summary_short text,
  add column if not exists original_title text,
  add column if not exists original_language text;
