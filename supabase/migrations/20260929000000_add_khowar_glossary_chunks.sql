create table if not exists public.khowar_glossary_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  headword text not null,
  english_gloss text not null,
  content text not null,
  source_name text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint khowar_glossary_chunks_source_unique unique (source_id)
);

create index if not exists khowar_glossary_chunks_embedding_hnsw_idx
  on public.khowar_glossary_chunks using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists khowar_glossary_chunks_source_id_idx
  on public.khowar_glossary_chunks (source_id);

alter table public.khowar_glossary_chunks enable row level security;
revoke all on table public.khowar_glossary_chunks from anon, authenticated;
grant select, insert, update, delete on table public.khowar_glossary_chunks to service_role;