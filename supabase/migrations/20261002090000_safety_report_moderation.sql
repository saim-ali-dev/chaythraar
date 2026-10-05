alter table public.hazards
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists additional_details text,
  add column if not exists photo_path text,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz;

update public.hazards
set moderation_status = 'approved'
where moderation_status = 'pending'
  and source_type is distinct from 'community';

alter table public.hazards
  drop constraint if exists hazards_moderation_status_check;

alter table public.hazards
  add constraint hazards_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

create index if not exists hazards_moderation_status_idx
  on public.hazards (moderation_status, submitted_at desc);

drop policy if exists "Public can read current hazards" on public.hazards;
drop policy if exists "Public can read safety hazards" on public.hazards;
create policy "Public can read approved safety hazards"
  on public.hazards for select
  to anon, authenticated
  using (moderation_status = 'approved');

create table if not exists public.safety_report_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.hazards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check (vote in ('correct', 'incorrect')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint safety_report_votes_one_per_user unique (report_id, user_id)
);

create index if not exists safety_report_votes_report_vote_idx
  on public.safety_report_votes (report_id, vote);

alter table public.safety_report_votes enable row level security;
revoke all on public.safety_report_votes from anon, public;
grant select, insert, update on public.safety_report_votes to authenticated;

create policy "Users can read their own safety vote"
  on public.safety_report_votes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can vote once on approved reports"
  on public.safety_report_votes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.moderation_status = 'approved'
    )
  );

create policy "Users can change their vote on approved reports"
  on public.safety_report_votes for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.moderation_status = 'approved'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.moderation_status = 'approved'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'safety-report-photos',
  'safety-report-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Safety report photos are server managed" on storage.objects;
create policy "Safety report photos are server managed"
  on storage.objects as restrictive
  for all
  to anon, authenticated
  using (bucket_id <> 'safety-report-photos')
  with check (bucket_id <> 'safety-report-photos');
