import { createHash } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createRagSupabaseClient } from "@/lib/supabase/rag";
import { embedRagDocument, GEMINI_EMBEDDING_DIMENSIONS, GEMINI_EMBEDDING_MODEL } from "@/lib/embeddings/gemini";

config({ path: resolve(process.cwd(), ".env.local") });

const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 25;
const CHUNK_LENGTH = 1400;
const CHUNK_OVERLAP = 180;
const INDEXER_ID = "chaythraar-rag-index-v1";
const INDEXABLE_SOURCE_TYPES = new Set<KnowledgeSourceType>(["encyclopedia", "news", "safety", "place", "translation", "khowar_lexicon"]);

type EncyclopediaRow = Pick<Database["public"]["Tables"]["encyclopedia"]["Row"], "id" | "title" | "category" | "content" | "image_url" | "source" | "source_url" | "created_at">;
type PlaceRow = Pick<Database["public"]["Tables"]["places"]["Row"], "id" | "name" | "description" | "category" | "latitude" | "longitude" | "opening_time" | "closing_time" | "source" | "created_at">;
type NewsRow = Pick<Database["public"]["Tables"]["news"]["Row"], "id" | "title" | "summary" | "headline" | "summary_short" | "original_title" | "original_language" | "source" | "source_url" | "published_at" | "category">;
type HazardRow = Pick<Database["public"]["Tables"]["hazards"]["Row"], "id" | "type" | "title" | "description" | "latitude" | "longitude" | "severity" | "status" | "source" | "source_name" | "source_url" | "source_type" | "location_name" | "reported_at" | "issued_at" | "expires_at">;
type TranslationRow = Pick<Database["public"]["Tables"]["translations"]["Row"], "id" | "khowar" | "urdu" | "english" | "example" | "verified" | "source">;
type KhowarLexiconRow = Pick<Database["public"]["Tables"]["khowar_lexicon"]["Row"], "id" | "dataset_id" | "record_type" | "record_index" | "entry" | "source_name" | "source_url" | "license" | "attribution">;
type ExistingChunk = Pick<Database["public"]["Tables"]["knowledge_chunks"]["Row"], "id" | "source_type" | "source_id" | "chunk_index" | "metadata">;
type ChunkInsert = Database["public"]["Tables"]["knowledge_chunks"]["Insert"];
type KnowledgeSourceType = Database["public"]["Tables"]["knowledge_chunks"]["Row"]["source_type"];

type IndexDocument = {
  source_type: KnowledgeSourceType;
  source_id: string;
  title: string;
  content: string;
  source_name: string | null;
  source_url: string | null;
  metadata: Json;
  source_record_count?: number;
};

type IndexChunk = IndexDocument & {
  chunk_index: number;
  fingerprint: string;
};

type IndexReport = {
  source_type: KnowledgeSourceType;
  source_records: number;
  chunks: number;
  unchanged: number;
  embedded: number;
  obsolete_removed: number;
};

async function main() {
  const supabase = createRagSupabaseClient();
  const [encyclopedia, places, news, hazards, translations, khowarLexicon, existingChunks] = await Promise.all([
    loadPages<EncyclopediaRow>((from, to) => supabase.from("encyclopedia")
      .select("id, title, category, content, image_url, source, source_url, created_at")
      .order("id").range(from, to)),
    loadPages<PlaceRow>((from, to) => supabase.from("places")
      .select("id, name, description, category, latitude, longitude, opening_time, closing_time, source, created_at")
      .order("id").range(from, to)),
    loadPages<NewsRow>((from, to) => supabase.from("news")
      .select("id, title, summary, headline, summary_short, original_title, original_language, source, source_url, published_at, category")
      .order("id").range(from, to)),
    loadPages<HazardRow>((from, to) => supabase.from("hazards")
      .select("id, type, title, description, latitude, longitude, severity, status, source, source_name, source_url, source_type, location_name, reported_at, issued_at, expires_at")
      .order("id").range(from, to)),
    loadPages<TranslationRow>((from, to) => supabase.from("translations")
      .select("id, khowar, urdu, english, example, verified, source")
      .eq("verified", true).order("id").range(from, to)),
    loadPages<KhowarLexiconRow>((from, to) => supabase.from("khowar_lexicon")
      .select("id, dataset_id, record_type, record_index, entry, source_name, source_url, license, attribution")
      .order("dataset_id").order("record_type").order("record_index").range(from, to)),
    loadPages<ExistingChunk>((from, to) => supabase.from("knowledge_chunks")
      .select("id, source_type, source_id, chunk_index, metadata")
      .order("id").range(from, to)),
  ]);

  const documents = [
    ...encyclopedia.map(toEncyclopediaDocument),
    ...places.map(toPlaceDocument),
    ...news.map(toNewsDocument),
    ...hazards.map(toHazardDocument),
    ...translations.filter((row) => row.verified).map(toTranslationDocument),
    ...toKhowarLexiconDocuments(khowarLexicon),
  ];

  const chunks = documents.flatMap(toIndexChunks);
  const existingByKey = new Map(existingChunks.map((chunk) => [chunkKey(chunk), chunk]));
  const rowsToWrite: ChunkInsert[] = [];
  const reportByType = new Map<KnowledgeSourceType, IndexReport>();

  for (const document of documents) {
    if (!reportByType.has(document.source_type)) {
      reportByType.set(document.source_type, {
        source_type: document.source_type,
        source_records: 0,
        chunks: 0,
        unchanged: 0,
        embedded: 0,
        obsolete_removed: 0,
      });
    }
    reportByType.get(document.source_type)!.source_records += document.source_record_count ?? 1;
  }

  const desiredKeys = new Set(chunks.map(chunkKey));
  for (const chunk of chunks) {
    const report = reportByType.get(chunk.source_type)!;
    report.chunks += 1;

    const previous = existingByKey.get(chunkKey(chunk));
    const previousIndexMetadata = previous ? readIndexMetadata(previous.metadata) : null;
    if (previousIndexMetadata?.owner === INDEXER_ID && previousIndexMetadata.fingerprint === chunk.fingerprint) {
      report.unchanged += 1;
      continue;
    }

    const embedding = await embedRagDocument(chunk.title, chunk.content);
    if (embedding.length !== GEMINI_EMBEDDING_DIMENSIONS) {
      throw new Error(`Gemini returned an unexpected embedding dimension for ${chunk.source_type}:${chunk.source_id}.`);
    }

    rowsToWrite.push({
      source_type: chunk.source_type,
      source_id: chunk.source_id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      source_name: chunk.source_name,
      source_url: chunk.source_url,
      metadata: withIndexMetadata(chunk.metadata, chunk.fingerprint),
      embedding: `[${embedding.join(",")}]`,
      updated_at: new Date().toISOString(),
    });
    report.embedded += 1;
  }

  for (let offset = 0; offset < rowsToWrite.length; offset += UPSERT_BATCH_SIZE) {
    const batch = rowsToWrite.slice(offset, offset + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from("knowledge_chunks").upsert(batch, {
      onConflict: "source_type,source_id,chunk_index",
    });
    if (error) throw new Error(`Could not store knowledge chunks: ${error.message}`);
  }

  const obsoleteChunks = existingChunks.filter((chunk) => {
    const ownership = readIndexMetadata(chunk.metadata);
    return INDEXABLE_SOURCE_TYPES.has(chunk.source_type)
      && ownership?.owner === INDEXER_ID
      && !desiredKeys.has(chunkKey(chunk));
  });
  const obsoleteIds = obsoleteChunks.map((chunk) => chunk.id);
  for (let offset = 0; offset < obsoleteIds.length; offset += UPSERT_BATCH_SIZE) {
    const batch = obsoleteIds.slice(offset, offset + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from("knowledge_chunks").delete().in("id", batch);
    if (error) throw new Error(`Could not remove obsolete knowledge chunks: ${error.message}`);
  }

  const reports = Array.from(reportByType.values());
  const staleCounts = countObsoleteByType(obsoleteChunks);
  for (const report of reports) report.obsolete_removed = staleCounts.get(report.source_type) ?? 0;

  for (const report of reports) {
    console.log(`${report.source_type}: records=${report.source_records}, chunks=${report.chunks}, unchanged=${report.unchanged}, embedded=${report.embedded}, obsolete_removed=${report.obsolete_removed}`);
  }
  console.log(`total: records=${reports.reduce((sum, item) => sum + item.source_records, 0)}, chunks=${chunks.length}, unchanged=${reports.reduce((sum, item) => sum + item.unchanged, 0)}, embedded=${rowsToWrite.length}, obsolete_removed=${obsoleteIds.length}`);
}

async function loadPages<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read source rows: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function toEncyclopediaDocument(row: EncyclopediaRow): IndexDocument {
  return {
    source_type: "encyclopedia",
    source_id: row.id,
    title: row.title,
    content: [`Title: ${row.title}`, `Category: ${row.category}`, row.content].join("\n\n"),
    source_name: row.source,
    source_url: row.source_url,
    metadata: { category: row.category, image_url: row.image_url, created_at: row.created_at },
  };
}

function toPlaceDocument(row: PlaceRow): IndexDocument {
  const details = [
    `Name: ${row.name}`,
    `Category: ${row.category}`,
    row.description ? `Description: ${row.description}` : null,
    row.latitude !== null && row.longitude !== null ? `Coordinates: ${row.latitude}, ${row.longitude}` : null,
    row.opening_time ? `Opens: ${row.opening_time}` : null,
    row.closing_time ? `Closes: ${row.closing_time}` : null,
  ].filter(Boolean);
  return {
    source_type: "place",
    source_id: row.id,
    title: row.name,
    content: details.join("\n"),
    source_name: row.source,
    source_url: null,
    metadata: { category: row.category, latitude: row.latitude, longitude: row.longitude, opening_time: row.opening_time, closing_time: row.closing_time },
  };
}

function toNewsDocument(row: NewsRow): IndexDocument {
  const useGenerated = Boolean(row.headline?.trim() && row.summary_short?.trim());
  const title = useGenerated ? row.headline!.trim() : row.title;
  const summary = useGenerated ? row.summary_short!.trim() : row.summary;
  return {
    source_type: "news",
    source_id: row.id,
    title,
    content: [`Title: ${title}`, `Category: ${row.category}`, `Published: ${row.published_at}`, summary].filter(Boolean).join("\n\n"),
    source_name: row.source,
    source_url: row.source_url,
    metadata: { category: row.category, published_at: row.published_at, original_title: row.original_title, original_language: row.original_language },
  };
}

function toHazardDocument(row: HazardRow): IndexDocument {
  const title = row.title?.trim() || row.type;
  return {
    source_type: "safety",
    source_id: row.id,
    title,
    content: [`Title: ${title}`, row.description].join("\n\n"),
    source_name: row.source_name ?? row.source,
    source_url: row.source_url,
    metadata: {
      event_type: row.type,
      severity: row.severity,
      status: row.status,
      source_type: row.source_type,
      location_name: row.location_name,
      latitude: row.latitude,
      longitude: row.longitude,
      issued_at: row.issued_at,
      reported_at: row.reported_at,
      expires_at: row.expires_at,
    },
  };
}

function toTranslationDocument(row: TranslationRow): IndexDocument {
  return {
    source_type: "translation",
    source_id: row.id,
    title: row.khowar,
    content: [`Khowar: ${row.khowar}`, `Urdu: ${row.urdu}`, `English: ${row.english}`, row.example ? `Example: ${row.example}` : null].filter(Boolean).join("\n"),
    source_name: row.source,
    source_url: null,
    metadata: { verified: true },
  };
}

function toKhowarLexiconDocuments(rows: KhowarLexiconRow[]): IndexDocument[] {
  const groups = new Map<string, KhowarLexiconRow[]>();
  for (const row of rows) {
    const key = `${row.dataset_id}:${row.record_type}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const kind = first.record_type === "letter" ? "letters" : "word-list entries";
    return {
      source_type: "khowar_lexicon",
      source_id: first.id,
      title: `Khowar ${kind}`,
      content: [
        `Khowar ${kind} from ${first.source_name}.`,
        "This source contains lexical/script data only; it provides no translations, definitions, or grammar explanations.",
        ...group.map((row) => `${row.record_index + 1}. ${row.entry}`),
      ].join("\n"),
      source_name: first.source_name,
      source_url: first.source_url,
      metadata: {
        dataset_id: first.dataset_id,
        record_type: first.record_type,
        record_count: group.length,
        license: first.license,
        attribution: first.attribution,
        record_index_start: first.record_index,
        record_index_end: group[group.length - 1].record_index,
      },
      source_record_count: group.length,
    };
  });
}

function toIndexChunks(document: IndexDocument): IndexChunk[] {
  return splitIntoChunks(document.content).map((content, chunkIndex) => ({
    ...document,
    chunk_index: chunkIndex,
    content,
    fingerprint: createFingerprint(document, chunkIndex, content),
  }));
}

function splitIntoChunks(input: string): string[] {
  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (text.length <= CHUNK_LENGTH) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_LENGTH, text.length);
    if (end < text.length) {
      const lowerBoundary = start + Math.floor(CHUNK_LENGTH * 0.55);
      const paragraph = text.lastIndexOf("\n\n", end);
      const sentence = Math.max(text.lastIndexOf(". ", end), text.lastIndexOf("? ", end), text.lastIndexOf("! ", end));
      const whitespace = text.lastIndexOf(" ", end);
      const preferredBoundary = Math.max(paragraph + 1, sentence + 1, whitespace);
      if (preferredBoundary >= lowerBoundary) end = preferredBoundary;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;

    start = Math.max(start + 1, end - CHUNK_OVERLAP);
    while (start < text.length && /\s/.test(text[start])) start += 1;
  }
  return chunks;
}

function createFingerprint(document: IndexDocument, chunkIndex: number, content: string): string {
  const stableValue = JSON.stringify({
    indexer: INDEXER_ID,
    model: GEMINI_EMBEDDING_MODEL,
    source_type: document.source_type,
    source_id: document.source_id,
    chunk_index: chunkIndex,
    content,
    source_name: document.source_name,
    source_url: document.source_url,
    metadata: document.metadata,
  });
  return createHash("sha256").update(stableValue).digest("hex");
}

function chunkKey(chunk: Pick<ExistingChunk, "source_type" | "source_id" | "chunk_index">): string {
  return `${chunk.source_type}:${chunk.source_id}:${chunk.chunk_index}`;
}

function readIndexMetadata(metadata: Json): { owner: string; fingerprint: string } | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const indexMetadata = metadata._index;
  if (!indexMetadata || typeof indexMetadata !== "object" || Array.isArray(indexMetadata)) return null;
  if (typeof indexMetadata.owner !== "string" || typeof indexMetadata.fingerprint !== "string") return null;
  return { owner: indexMetadata.owner, fingerprint: indexMetadata.fingerprint };
}

function withIndexMetadata(metadata: Json, fingerprint: string): Json {
  const sourceMetadata = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return {
    ...sourceMetadata,
    _index: { owner: INDEXER_ID, model: GEMINI_EMBEDDING_MODEL, fingerprint },
  };
}

function countObsoleteByType(obsoleteChunks: ExistingChunk[]): Map<KnowledgeSourceType, number> {
  const counts = new Map<KnowledgeSourceType, number>();
  for (const chunk of obsoleteChunks) {
    counts.set(chunk.source_type, (counts.get(chunk.source_type) ?? 0) + 1);
  }
  return counts;
}

void main().catch((error: unknown) => {
  console.error(`RAG indexing failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
