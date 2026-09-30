import { createHash } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createRagSupabaseClient } from "@/lib/supabase/rag";
import { embedRagDocument, GEMINI_EMBEDDING_DIMENSIONS, GEMINI_EMBEDDING_MODEL } from "@/lib/embeddings/gemini";
import { embedVoyageDocuments, VOYAGE_EMBEDDING_DIMENSIONS, VOYAGE_EMBEDDING_MODEL } from "@/lib/embeddings/voyage";

config({ path: resolve(process.cwd(), ".env.local") });

const PAGE_SIZE = 500;
const UPSERT_BATCH_SIZE = 25;
const CHUNK_LENGTH = 1400;
const CHUNK_OVERLAP = 180;
const KHOWAR_BATCH_MAX_RECORDS = 80;
const KHOWAR_BATCH_MAX_CHARACTERS = 1200;
const KHOWAR_TOKENS_PER_CHARACTER_ESTIMATE = 0.85;
const KHOWAR_TARGET_TOKENS_PER_MINUTE = 20000;
const INDEXER_ID = "chaythraar-rag-index-v1";
const INDEXABLE_SOURCE_TYPES = new Set<KnowledgeSourceType>(["encyclopedia", "news", "safety", "place", "translation", "khowar_lexicon", "khowar_glossary"]);
const KNOWLEDGE_CHUNK_SOURCE_TYPES = new Set<KnowledgeSourceType>(["encyclopedia", "news", "safety", "place", "translation", "khowar_lexicon"]);

type EncyclopediaRow = Pick<Database["public"]["Tables"]["encyclopedia"]["Row"], "id" | "title" | "category" | "content" | "image_url" | "source" | "source_url" | "created_at">;
type PlaceRow = Pick<Database["public"]["Tables"]["places"]["Row"], "id" | "name" | "description" | "category" | "latitude" | "longitude" | "opening_time" | "closing_time" | "source" | "source_url" | "created_at">;
type NewsRow = Pick<Database["public"]["Tables"]["news"]["Row"], "id" | "title" | "summary" | "headline" | "summary_short" | "original_title" | "original_language" | "source" | "source_url" | "published_at" | "category">;
type HazardRow = Pick<Database["public"]["Tables"]["hazards"]["Row"], "id" | "type" | "title" | "description" | "latitude" | "longitude" | "severity" | "status" | "source" | "source_name" | "source_url" | "source_type" | "location_name" | "reported_at" | "issued_at" | "expires_at">;
type TranslationRow = Pick<Database["public"]["Tables"]["translations"]["Row"], "id" | "khowar" | "urdu" | "english" | "example" | "verified" | "source">;
type KhowarLexiconRow = Pick<Database["public"]["Tables"]["khowar_lexicon"]["Row"], "id" | "dataset_id" | "record_type" | "record_index" | "entry" | "source_name" | "source_url" | "license" | "attribution">;
type KhowarGlossaryRow = Pick<Database["public"]["Tables"]["khowar_glossary"]["Row"], "id" | "source_entry_id" | "headword" | "english_gloss" | "english_definition" | "cultural_notes" | "examples" | "source_author" | "source_title" | "publication_year" | "source_url" | "source_doi" | "source_locator" | "license" | "attribution" | "project_permission" | "provenance">;
type KhowarGlossaryChunkRow = Pick<Database["public"]["Tables"]["khowar_glossary_chunks"]["Row"], "source_id" | "metadata">;
type KhowarGlossaryChunkInsert = Database["public"]["Tables"]["khowar_glossary_chunks"]["Insert"];
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
  chunk_index_offset?: number;
  pre_chunked?: boolean;
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
  const sourceTypeFilter = parseSourceTypeFilter(process.argv.slice(2));
  const supabase = createRagSupabaseClient();
  if (sourceTypeFilter === "khowar_glossary") {
    await indexKhowarGlossary(supabase);
    return;
  }

  const loadSource = <Row>(
    sourceType: KnowledgeSourceType,
    fetchPage: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
  ) => sourceTypeFilter && sourceTypeFilter !== sourceType
    ? Promise.resolve([] as Row[])
    : loadPages(fetchPage);
  const [encyclopedia, places, news, hazards, translations, khowarLexicon, existingChunks] = await Promise.all([
    loadSource<EncyclopediaRow>("encyclopedia", (from, to) => supabase.from("encyclopedia")
      .select("id, title, category, content, image_url, source, source_url, created_at")
      .order("id").range(from, to)),
    loadSource<PlaceRow>("place", (from, to) => supabase.from("places")
      .select("id, name, description, category, latitude, longitude, opening_time, closing_time, source, source_url, created_at")
      .order("id").range(from, to)),
    loadSource<NewsRow>("news", (from, to) => supabase.from("news")
      .select("id, title, summary, headline, summary_short, original_title, original_language, source, source_url, published_at, category")
      .order("id").range(from, to)),
    loadSource<HazardRow>("safety", (from, to) => supabase.from("hazards")
      .select("id, type, title, description, latitude, longitude, severity, status, source, source_name, source_url, source_type, location_name, reported_at, issued_at, expires_at")
      .order("id").range(from, to)),
    loadSource<TranslationRow>("translation", (from, to) => supabase.from("translations")
      .select("id, khowar, urdu, english, example, verified, source")
      .eq("verified", true).order("id").range(from, to)),
    loadSource<KhowarLexiconRow>("khowar_lexicon", (from, to) => supabase.from("khowar_lexicon")
      .select("id, dataset_id, record_type, record_index, entry, source_name, source_url, license, attribution")
      .order("dataset_id").order("record_type").order("record_index").range(from, to)),
    loadPages<ExistingChunk>((from, to) => {
      const baseQuery = supabase.from("knowledge_chunks")
        .select("id, source_type, source_id, chunk_index, metadata");
      const query = sourceTypeFilter ? baseQuery.eq("source_type", sourceTypeFilter) : baseQuery;
      return query.order("id").range(from, to);
    }),
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
  let nextKhowarEmbeddingAt = 0;

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

    if (chunk.source_type === "khowar_lexicon") {
      const waitMs = Math.max(0, nextKhowarEmbeddingAt - Date.now());
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      nextKhowarEmbeddingAt = Date.now() + getKhowarEmbeddingIntervalMs(chunk);
    }

    let embedding: number[];
    try {
      embedding = await embedRagDocument(chunk.title, chunk.content);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Could not embed ${chunk.source_type}:${chunk.source_id} chunk ${chunk.chunk_index}: ${reason}`);
    }
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
    return KNOWLEDGE_CHUNK_SOURCE_TYPES.has(chunk.source_type)
      && (!sourceTypeFilter || chunk.source_type === sourceTypeFilter)
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

  if (!sourceTypeFilter) await indexKhowarGlossary(supabase);
}

function parseSourceTypeFilter(args: string[]): KnowledgeSourceType | null {
  const optionIndexes = args.flatMap((argument, index) => argument === "--source-type" ? [index] : []);
  if (optionIndexes.length === 0) return null;
  if (optionIndexes.length > 1) throw new Error("Pass --source-type only once.");

  const sourceType = args[optionIndexes[0] + 1];
  if (!sourceType || !INDEXABLE_SOURCE_TYPES.has(sourceType as KnowledgeSourceType)) {
    throw new Error(`--source-type must be one of: ${[...INDEXABLE_SOURCE_TYPES].join(", ")}.`);
  }
  return sourceType as KnowledgeSourceType;
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
    source_url: row.source_url ?? null,
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

type KhowarGlossaryDocument = {
  source_id: string;
  headword: string;
  english_gloss: string;
  content: string;
  source_name: string | null;
  source_url: string | null;
  metadata: Json;
};

function toKhowarGlossaryDocument(row: KhowarGlossaryRow): KhowarGlossaryDocument {
  const title = `Bashir glossary: ${row.headword}`;
  const citation = [
    `${row.source_author}, ${row.source_title} (${row.publication_year})`,
    row.source_locator,
    `DOI: ${row.source_doi}`,
  ].filter(Boolean).join(", ");
  const partOfSpeech = getProvenanceStringArray(row.provenance, "partOfSpeech");
  const rawSourceExcerpt = getProvenanceString(row.provenance, "rawSourceExcerpt");
  const examples = Array.isArray(row.examples) && row.examples.length > 0 ? JSON.stringify(row.examples) : null;
  const content = [
    title,
    `Source entry ID: ${row.source_entry_id}`,
    `Headword: ${row.headword}`,
    row.english_gloss ? `English gloss: ${row.english_gloss}` : null,
    row.english_definition ? `English definition: ${row.english_definition}` : null,
    row.cultural_notes ? `Cultural notes: ${row.cultural_notes}` : null,
    partOfSpeech.length > 0 ? `Part of speech: ${partOfSpeech.join(", ")}` : null,
    examples ? `Examples: ${examples}` : null,
    rawSourceExcerpt ? `Source excerpt: ${rawSourceExcerpt}` : null,
    `Citation: ${citation}`,
  ].filter(Boolean).join("\n");

  return {
    source_id: row.id,
    headword: row.headword,
    english_gloss: row.english_gloss ?? row.english_definition ?? "",
    content,
    source_name: row.source_author,
    source_url: row.source_url,
    metadata: {
      title,
      source_entry_id: row.source_entry_id,
      headword: row.headword,
      english_gloss: row.english_gloss,
      english_definition: row.english_definition,
      cultural_notes: row.cultural_notes,
      examples: row.examples,
      source_author: row.source_author,
      source_title: row.source_title,
      publication_year: row.publication_year,
      source_url: row.source_url,
      source_doi: row.source_doi,
      source_locator: row.source_locator,
      license: row.license,
      attribution: row.attribution,
      project_permission: row.project_permission,
      provenance: row.provenance,
    },
  };
}

async function indexKhowarGlossary(supabase: ReturnType<typeof createRagSupabaseClient>): Promise<void> {
  const [sourceRows, existingRows] = await Promise.all([
    loadPages<KhowarGlossaryRow>((from, to) => supabase.from("khowar_glossary")
      .select("id, source_entry_id, headword, english_gloss, english_definition, cultural_notes, examples, source_author, source_title, publication_year, source_url, source_doi, source_locator, license, attribution, project_permission, provenance")
      .order("id").range(from, to)),
    loadPages<KhowarGlossaryChunkRow>((from, to) => supabase.from("khowar_glossary_chunks")
      .select("source_id, metadata")
      .order("source_id").range(from, to)),
  ]);

  const existingBySourceId = new Map(existingRows.map((row) => [row.source_id, row]));
  const unchangedSourceIds = new Set<string>();
  const pending: Array<{ document: KhowarGlossaryDocument; fingerprint: string }> = [];
  let inserted = 0;
  let updated = 0;

  for (const row of sourceRows) {
    const document = toKhowarGlossaryDocument(row);
    const fingerprint = createKhowarGlossaryFingerprint(document);
    const existing = existingBySourceId.get(document.source_id);
    const existingIndex = existing ? readIndexMetadata(existing.metadata) : null;
    if (existingIndex?.owner === INDEXER_ID && existingIndex.fingerprint === fingerprint) {
      unchangedSourceIds.add(document.source_id);
      continue;
    }

    if (existing) updated += 1;
    else inserted += 1;
    pending.push({ document, fingerprint });
  }

  const embeddings = await embedVoyageDocuments(pending.map(({ document }) => document.content));
  if (embeddings.length !== pending.length) {
    throw new Error(`Voyage returned ${embeddings.length} embeddings for ${pending.length} glossary entries.`);
  }

  const rowsToUpsert: KhowarGlossaryChunkInsert[] = pending.map(({ document, fingerprint }, index) => {
    const embedding = embeddings[index];
    if (!embedding || embedding.length !== VOYAGE_EMBEDDING_DIMENSIONS) {
      throw new Error(`Voyage returned an invalid vector for glossary source ${document.source_id}.`);
    }
    return {
      source_id: document.source_id,
      headword: document.headword,
      english_gloss: document.english_gloss,
      content: document.content,
      source_name: document.source_name,
      source_url: document.source_url,
      metadata: withVoyageIndexMetadata(document.metadata, fingerprint),
      embedding: `[${embedding.join(",")}]`,
      updated_at: new Date().toISOString(),
    };
  });

  for (let offset = 0; offset < rowsToUpsert.length; offset += UPSERT_BATCH_SIZE) {
    const batch = rowsToUpsert.slice(offset, offset + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from("khowar_glossary_chunks").upsert(batch, { onConflict: "source_id" });
    if (error) throw new Error(`Could not store Voyage Khowar glossary vectors: ${error.message}`);
  }

  const sourceIds = new Set(sourceRows.map((row) => row.id));
  const obsoleteRows = existingRows.filter((row) => !sourceIds.has(row.source_id));
  for (let offset = 0; offset < obsoleteRows.length; offset += UPSERT_BATCH_SIZE) {
    const sourceIdsToDelete = obsoleteRows.slice(offset, offset + UPSERT_BATCH_SIZE).map((row) => row.source_id);
    const { error } = await supabase.from("khowar_glossary_chunks").delete().in("source_id", sourceIdsToDelete);
    if (error) throw new Error(`Could not remove obsolete Voyage Khowar glossary vectors: ${error.message}`);
  }

  console.log(`khowar_glossary: inserted=${inserted}, updated=${updated}, unchanged=${unchangedSourceIds.size}, obsolete=${obsoleteRows.length}`);
}

function createKhowarGlossaryFingerprint(document: KhowarGlossaryDocument): string {
  const stableValue = JSON.stringify({
    indexer: INDEXER_ID,
    model: VOYAGE_EMBEDDING_MODEL,
    source_id: document.source_id,
    headword: document.headword,
    english_gloss: document.english_gloss,
    content: document.content,
    source_name: document.source_name,
    source_url: document.source_url,
    metadata: document.metadata,
  });
  return createHash("sha256").update(stableValue).digest("hex");
}

function withVoyageIndexMetadata(metadata: Json, fingerprint: string): Json {
  const sourceMetadata = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return {
    ...sourceMetadata,
    _index: { owner: INDEXER_ID, model: VOYAGE_EMBEDDING_MODEL, fingerprint },
  };
}

function getProvenanceString(provenance: Json, key: string): string | null {
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) return null;
  const value = provenance[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProvenanceStringArray(provenance: Json, key: string): string[] {
  if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) return [];
  const value = provenance[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toKhowarLexiconDocuments(rows: KhowarLexiconRow[]): IndexDocument[] {
  const groups = new Map<string, KhowarLexiconRow[]>();
  for (const row of rows) {
    const key = `${row.dataset_id}:${row.record_type}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.values()).flatMap((unsortedGroup) => {
    const group = [...unsortedGroup].sort((left, right) => left.record_index - right.record_index);
    const first = group[0];
    const kind = first.record_type === "letter" ? "letters" : "word-list entries";
    const header = [
      `Khowar ${kind} from ${first.source_name}.`,
      "This source contains lexical/script data only; it provides no translations, definitions, or grammar explanations.",
    ];
    const headerLength = header.join("\n").length;
    const documents: IndexDocument[] = [];
    let batch: KhowarLexiconRow[] = [];
    let batchLength = headerLength;

    const flushBatch = () => {
      if (batch.length === 0) return;
      const batchFirst = batch[0];
      const batchLast = batch[batch.length - 1];
      documents.push({
        source_type: "khowar_lexicon",
        source_id: first.id,
        title: `Khowar ${kind}`,
        content: [...header, ...batch.map((row) => `${row.record_index + 1}. ${row.entry}`)].join("\n"),
        source_name: first.source_name,
        source_url: first.source_url,
        metadata: {
          dataset_id: first.dataset_id,
          record_type: first.record_type,
          record_count: batch.length,
          license: first.license,
          attribution: first.attribution,
          record_index_start: batchFirst.record_index,
          record_index_end: batchLast.record_index,
        },
        source_record_count: batch.length,
        chunk_index_offset: documents.length,
        pre_chunked: true,
      });
      batch = [];
      batchLength = headerLength;
    };

    for (const row of group) {
      const line = `${row.record_index + 1}. ${row.entry}`;
      const nextLength = batchLength + 1 + line.length;
      if (batch.length > 0 && (batch.length >= KHOWAR_BATCH_MAX_RECORDS || nextLength > KHOWAR_BATCH_MAX_CHARACTERS)) {
        flushBatch();
      }
      batch.push(row);
      batchLength += 1 + line.length;
    }
    flushBatch();
    return documents;
  });
}

function toIndexChunks(document: IndexDocument): IndexChunk[] {
  const contentChunks = document.pre_chunked ? [document.content] : splitIntoChunks(document.content);
  return contentChunks.map((content, chunkIndex) => ({
    ...document,
    chunk_index: (document.chunk_index_offset ?? 0) + chunkIndex,
    content,
    fingerprint: createFingerprint(document, (document.chunk_index_offset ?? 0) + chunkIndex, content),
  }));
}

function getKhowarEmbeddingIntervalMs(chunk: IndexChunk): number {
  const requestText = `task: search result | title: ${chunk.title.trim() || "none"} | text: ${chunk.content.trim()}`;
  const estimatedTokens = Math.ceil(requestText.length * KHOWAR_TOKENS_PER_CHARACTER_ESTIMATE);
  return Math.ceil((estimatedTokens / KHOWAR_TARGET_TOKENS_PER_MINUTE) * 60_000);
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
