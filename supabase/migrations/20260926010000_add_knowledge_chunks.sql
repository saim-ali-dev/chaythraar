create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('encyclopedia', 'news', 'safety', 'place', 'translation')),
  source_id uuid not null,
  chunk_index integer not null default 0 check (chunk_index >= 0),
  content text not null,
  source_name text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_chunks_source_chunk_unique unique (source_type, source_id, chunk_index)
);

comment on column public.knowledge_chunks.embedding is
  '1536-dimensional Gemini Embedding 2 vector; use the same model and task prefix for indexed documents and queries.';

create index if not exists knowledge_chunks_embedding_hnsw_idx
  on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists knowledge_chunks_source_type_idx
  on public.knowledge_chunks (source_type);

create index if not exists knowledge_chunks_source_record_idx
  on public.knowledge_chunks (source_type, source_id);

alter table public.knowledge_chunks enable row level security;
revoke all on table public.knowledge_chunks from anon, authenticated;
grant select, insert, update, delete on table public.knowledge_chunks to service_role;

create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_count integer default 10,
  source_type_filter text default null
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  chunk_index integer,
  content text,
  source_name text,
  source_url text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    chunk.id,
    chunk.source_type,
    chunk.source_id,
    chunk.chunk_index,
    chunk.content,
    chunk.source_name,
    chunk.source_url,
    chunk.metadata,
    1 - (chunk.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks as chunk
  where source_type_filter is null or chunk.source_type = source_type_filter
  order by chunk.embedding OPERATOR(extensions.<=>) query_embedding
  limit least(greatest(coalesce(match_count, 10), 1), 50);
$$;

revoke all on function public.match_knowledge_chunks(extensions.vector, integer, text) from public, anon, authenticated;
grant execute on function public.match_knowledge_chunks(extensions.vector, integer, text) to service_role;
