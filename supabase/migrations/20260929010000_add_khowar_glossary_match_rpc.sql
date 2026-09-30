create or replace function public.match_khowar_glossary_chunks(
  query_embedding extensions.vector(1024),
  query_terms text[],
  match_count integer default 8
)
returns table (
  source_id uuid,
  headword text,
  english_gloss text,
  content text,
  source_name text,
  source_url text,
  metadata jsonb,
  similarity double precision,
  lexical_score double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with normalized_query as (
    select
      coalesce(query_terms, array[]::text[]) as terms,
      to_tsquery(
        'simple',
        nullif(array_to_string(coalesce(query_terms, array[]::text[]), ' | '), '')
      ) as tsquery
  ), ranked as (
    select
      chunk.source_id,
      chunk.headword,
      chunk.english_gloss,
      chunk.content,
      chunk.source_name,
      chunk.source_url,
      chunk.metadata,
      1 - (chunk.embedding OPERATOR(extensions.<=>) query_embedding) as similarity,
      case
        when lower(chunk.headword) = any(query.terms) then 1.0::double precision
        when lower(chunk.english_gloss) = any(query.terms) then 0.9::double precision
        else coalesce(
          ts_rank_cd(
            setweight(to_tsvector('simple', coalesce(chunk.headword, '')), 'A')
              || setweight(to_tsvector('simple', coalesce(chunk.english_gloss, '')), 'B')
              || to_tsvector('simple', coalesce(chunk.content, '')),
            query.tsquery
          ),
          0
        )::double precision
      end as lexical_score
    from public.khowar_glossary_chunks as chunk
    cross join normalized_query as query
  )
  select
    ranked.source_id,
    ranked.headword,
    ranked.english_gloss,
    ranked.content,
    ranked.source_name,
    ranked.source_url,
    ranked.metadata,
    ranked.similarity,
    ranked.lexical_score
  from ranked
  where ranked.lexical_score > 0 or ranked.similarity >= 0.35
  order by ranked.lexical_score desc, ranked.similarity desc
  limit least(greatest(coalesce(match_count, 8), 1), 50);
$$;

revoke all on function public.match_khowar_glossary_chunks(extensions.vector, text[], integer)
  from public, anon, authenticated;
grant execute on function public.match_khowar_glossary_chunks(extensions.vector, text[], integer)
  to service_role;