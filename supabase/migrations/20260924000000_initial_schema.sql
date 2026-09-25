create extension if not exists pgcrypto;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  latitude double precision,
  longitude double precision,
  category text not null,
  image_url text,
  opening_time time,
  closing_time time,
  source text,
  created_at timestamptz not null default now(),
  constraint places_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint places_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.encyclopedia (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content text not null,
  image_url text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  source text not null,
  source_url text,
  image_url text,
  published_at timestamptz not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hazards (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  description text not null,
  latitude double precision,
  longitude double precision,
  severity text not null,
  status text not null default 'active',
  source text,
  reported_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint hazards_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint hazards_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint hazards_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint hazards_status_check check (status in ('active', 'resolved', 'closed'))
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  khowar text not null,
  urdu text not null,
  english text not null,
  example text,
  verified boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists places_category_idx on public.places (category);
create index if not exists encyclopedia_category_idx on public.encyclopedia (category);
create index if not exists news_published_at_idx on public.news (published_at desc);
create index if not exists news_category_idx on public.news (category);
create index if not exists hazards_status_idx on public.hazards (status);
create index if not exists hazards_reported_at_idx on public.hazards (reported_at desc);
create index if not exists translations_verified_idx on public.translations (verified);

alter table public.places enable row level security;
alter table public.encyclopedia enable row level security;
alter table public.news enable row level security;
alter table public.hazards enable row level security;
alter table public.translations enable row level security;

create policy "Public can read places"
  on public.places for select
  to anon, authenticated
  using (true);

create policy "Public can read encyclopedia"
  on public.encyclopedia for select
  to anon, authenticated
  using (true);

create policy "Public can read news"
  on public.news for select
  to anon, authenticated
  using (true);

create policy "Public can read current hazards"
  on public.hazards for select
  to anon, authenticated
  using (status in ('active', 'resolved'));

create policy "Public can read verified translations"
  on public.translations for select
  to anon, authenticated
  using (verified = true);
