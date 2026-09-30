import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GEMINI_EMBEDDING_DIMENSIONS } from "@/lib/embeddings/gemini";
import { VOYAGE_EMBEDDING_DIMENSIONS } from "@/lib/embeddings/voyage";
import type { Database } from "@/lib/supabase/database.types";

export type KnowledgeChunkMatch = Database["public"]["Functions"]["match_knowledge_chunks"]["Returns"][number];
export type KhowarGlossaryChunkMatch = Database["public"]["Functions"]["match_khowar_glossary_chunks"]["Returns"][number];
export type KnowledgeSourceType = Database["public"]["Tables"]["knowledge_chunks"]["Row"]["source_type"];

type KnowledgeMatchOptions = {
  matchCount?: number;
  sourceTypeFilter?: KnowledgeSourceType | null;
};

export function createRagSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY before using RAG retrieval.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function matchKnowledgeChunks(
  queryEmbedding: number[],
  options: KnowledgeMatchOptions = {},
): Promise<KnowledgeChunkMatch[]> {
  if (queryEmbedding.length !== GEMINI_EMBEDDING_DIMENSIONS
    || !queryEmbedding.every((value) => Number.isFinite(value))) {
    throw new Error(`Query embedding must contain ${GEMINI_EMBEDDING_DIMENSIONS} finite values.`);
  }

  const supabase = createRagSupabaseClient();
  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_count: options.matchCount ?? 10,
    source_type_filter: options.sourceTypeFilter ?? null,
  });

  if (error) throw new Error(`RAG similarity search failed: ${error.message}`);
  return data ?? [];
}

export async function matchKhowarGlossaryChunks(
  queryEmbedding: number[],
  queryTerms: string[],
  matchCount = 8,
): Promise<KhowarGlossaryChunkMatch[]> {
  if (queryEmbedding.length !== VOYAGE_EMBEDDING_DIMENSIONS
    || !queryEmbedding.every((value) => Number.isFinite(value))) {
    throw new Error(`Khowar glossary query embedding must contain ${VOYAGE_EMBEDDING_DIMENSIONS} finite values.`);
  }

  const supabase = createRagSupabaseClient();
  const { data, error } = await supabase.rpc("match_khowar_glossary_chunks", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    query_terms: queryTerms,
    match_count: matchCount,
  });

  if (error) throw new Error(`Khowar glossary retrieval failed: ${error.message}`);
  return data ?? [];
}
