alter table public.knowledge_chunks
  drop constraint if exists knowledge_chunks_source_type_check;

alter table public.knowledge_chunks
  add constraint knowledge_chunks_source_type_check
  check (source_type in ('encyclopedia', 'news', 'safety', 'place', 'translation', 'khowar_lexicon', 'khowar_glossary'));