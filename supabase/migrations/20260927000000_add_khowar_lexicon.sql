create table if not exists public.khowar_lexicon (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null,
  record_type text not null check (record_type in ('letter', 'word')),
  record_index integer not null check (record_index >= 0),
  entry text not null,
  source_name text not null,
  source_url text not null,
  license text not null,
  attribution text not null,
  created_at timestamptz not null default now(),
  constraint khowar_lexicon_dataset_record_unique unique (dataset_id, record_type, record_index)
);

create index if not exists khowar_lexicon_entry_idx on public.khowar_lexicon (entry);
create index if not exists khowar_lexicon_dataset_type_idx on public.khowar_lexicon (dataset_id, record_type);

alter table public.khowar_lexicon enable row level security;
create policy "Public can read Khowar lexicon"
  on public.khowar_lexicon for select
  to anon, authenticated
  using (true);
grant select on table public.khowar_lexicon to anon, authenticated;
grant select, insert, update, delete on table public.khowar_lexicon to service_role;

alter table public.knowledge_chunks
  drop constraint if exists knowledge_chunks_source_type_check;
alter table public.knowledge_chunks
  add constraint knowledge_chunks_source_type_check
  check (source_type in ('encyclopedia', 'news', 'safety', 'place', 'translation', 'khowar_lexicon'));