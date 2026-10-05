alter table public.encyclopedia
  add column if not exists image_source text,
  add column if not exists image_credit text,
  add column if not exists image_license text;

alter table public.places
  add column if not exists image_source text,
  add column if not exists image_credit text,
  add column if not exists image_license text;

alter table public.news
  add column if not exists image_source text,
  add column if not exists image_credit text,
  add column if not exists image_license text;

create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  media_key text not null unique,
  title text not null,
  category text not null,
  image_url text,
  image_source text,
  image_credit text,
  image_license text,
  created_at timestamptz not null default now()
);

alter table public.site_media enable row level security;

drop policy if exists "Public can read site media" on public.site_media;
create policy "Public can read site media"
  on public.site_media for select
  to anon, authenticated
  using (true);

insert into public.site_media (media_key, title, category)
values
  ('profile_hero', 'Profile Hero Image', 'Profile'),
  ('team_saim_ali', 'Saim Ali', 'Team'),
  ('team_faizan_ali_haidar', 'Faizan Ali Haidar', 'Team'),
  ('team_hidayat_ali', 'Hidayat Ali', 'Team'),
  ('team_suhaib_nazir', 'Suhaib Nazir', 'Team')
on conflict (media_key) do nothing;
