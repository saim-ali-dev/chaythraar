create table if not exists public.khowar_glossary (
  id uuid primary key default gen_random_uuid(),
  source_entry_id text not null,
  headword text not null,
  english_gloss text,
  english_definition text,
  cultural_notes text,
  examples jsonb not null default '[]'::jsonb,
  source_author text not null,
  source_title text not null,
  publication_year integer not null check (publication_year between 1900 and 2100),
  source_url text not null,
  source_doi text not null,
  source_locator text,
  license text not null,
  attribution text not null,
  project_permission text not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint khowar_glossary_source_entry_unique unique (source_doi, source_entry_id),
  constraint khowar_glossary_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint khowar_glossary_provenance_object check (jsonb_typeof(provenance) = 'object')
);

comment on table public.khowar_glossary is
  'Structured Khowar-English glossary records from Elena Bashir, kept separate from the FLI lexical/script word list.';
comment on column public.khowar_glossary.examples is
  'Structured example records; preserve Khowar examples and any supplied English translations without inventing text.';
comment on column public.khowar_glossary.project_permission is
  'Record of permission granted specifically to CHAYTHRAAR for noncommercial school/hackathon cultural-preservation use.';

create index if not exists khowar_glossary_headword_idx on public.khowar_glossary (headword);
create index if not exists khowar_glossary_source_doi_idx on public.khowar_glossary (source_doi);

alter table public.khowar_glossary enable row level security;
create policy "Public can read Khowar glossary"
  on public.khowar_glossary for select
  to anon, authenticated
  using (true);
grant select on table public.khowar_glossary to anon, authenticated;
grant select, insert, update, delete on table public.khowar_glossary to service_role;
