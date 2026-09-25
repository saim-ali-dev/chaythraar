alter table public.hazards
  add column if not exists title text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists location_name text,
  add column if not exists issued_at timestamptz,
  add column if not exists expires_at timestamptz;

alter table public.hazards
  drop constraint if exists hazards_status_check;

alter table public.hazards
  add constraint hazards_status_check
  check (status in ('active', 'resolved', 'closed', 'expired', 'unverified'));

alter table public.hazards
  add constraint hazards_source_type_check
  check (source_type is null or source_type in ('official', 'news', 'community'));

create index if not exists hazards_source_type_idx on public.hazards (source_type);
create index if not exists hazards_expires_at_idx on public.hazards (expires_at);
