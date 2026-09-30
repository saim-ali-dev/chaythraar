import type { SupabaseClient } from "@supabase/supabase-js";
import { chitralTodayAdapter } from "@/lib/news/sources/chitral-today";
import { fetchChitralTimesItems, normalizeChitralTimesItem } from "@/lib/news/chitral-times";
import { deduplicateNewsItems, hasGeneratedNewsSummary, hasMaterialNewsChange, isNewsWithinActiveWindow, selectTopNewsItems } from "@/lib/news/lifecycle";
import { isNewsSummarizationConfigured, summarizeNews } from "@/lib/news/summarize-core";
import { createNewsIngestionSupabaseClient } from "@/lib/news/supabase";
import type { NewsIngestionReport, NewsSourceAdapter, NormalizedNewsItem } from "@/lib/news/types";
import type { NewsSummarizationInput, NewsSummarizationResult } from "@/lib/news/summarize-core";
import type { Database } from "@/lib/supabase/database.types";

const chitralTimesAdapter: NewsSourceAdapter = {
  name: "Chitral Times",
  fetchItems: fetchChitralTimesItems,
  normalizeItem: normalizeChitralTimesItem,
};

export const newsSourceAdapters: NewsSourceAdapter[] = [chitralTimesAdapter, chitralTodayAdapter];

type NewsRow = Database["public"]["Tables"]["news"]["Row"];
type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
type NewsUpdate = Database["public"]["Tables"]["news"]["Update"];
type NewsSourceFields = Pick<NewsInsert,
  | "title"
  | "summary"
  | "original_title"
  | "original_language"
  | "source"
  | "source_url"
  | "image_url"
  | "published_at"
  | "category"
>;

export type ExistingNewsRow = Pick<NewsRow,
  | "id"
  | "title"
  | "summary"
  | "source"
  | "source_url"
  | "headline"
  | "summary_short"
  | "original_title"
  | "original_language"
  | "category"
  | "published_at"
>;

export type NewsIngestionRepository = {
  listBySource: (source: string, sourceUrls: string[]) => Promise<{ rows: ExistingNewsRow[]; error: string | null }>;
  insert: (rows: NewsInsert[]) => Promise<{ inserted: number; error: string | null }>;
  update: (id: string, values: NewsUpdate) => Promise<{ error: string | null }>;
};

export type NewsIngestionOptions = {
  now?: Date;
  repository?: NewsIngestionRepository;
  summarizationConfigured?: boolean;
  summarize?: (input: NewsSummarizationInput) => Promise<NewsSummarizationResult | null>;
};

type Candidate = {
  item: NormalizedNewsItem;
  existing: ExistingNewsRow | null;
  state: "new" | "updated" | "unchanged";
};

export async function ingestChitralTimes(options?: NewsIngestionOptions): Promise<NewsIngestionReport> {
  return ingestNewsSources([chitralTimesAdapter], options);
}

export async function ingestChitralToday(options?: NewsIngestionOptions): Promise<NewsIngestionReport> {
  return ingestNewsSources([chitralTodayAdapter], options);
}

export async function ingestAllNewsSources(options?: NewsIngestionOptions): Promise<NewsIngestionReport> {
  return ingestNewsSources(newsSourceAdapters, options);
}

export async function ingestNewsSources(
  adapters: NewsSourceAdapter[],
  options: NewsIngestionOptions = {},
): Promise<NewsIngestionReport> {
  const report = createEmptyReport();
  const fetchedItems: Array<{ adapter: NewsSourceAdapter; raw: unknown }> = [];
  const now = options.now ?? new Date();

  for (const adapter of adapters) {
    try {
      const rawItems = await adapter.fetchItems();
      report.fetched += rawItems.length;
      report.discovered += rawItems.length;
      fetchedItems.push(...rawItems.map((raw) => ({ adapter, raw })));
    } catch (error) {
      report.failed += 1;
      report.errors.push(`${adapter.name}: ${errorMessage(error, "The RSS request failed.")}`);
    }
  }

  const normalized: NormalizedNewsItem[] = [];
  for (const { adapter, raw } of fetchedItems) {
    try {
      const item = adapter.normalizeItem(raw);
      if (!item) {
        report.skipped += 1;
        continue;
      }
      normalized.push(item);
    } catch (error) {
      report.failed += 1;
      report.errors.push(`${adapter.name}: ${errorMessage(error, "Could not normalize a feed item.")}`);
    }
  }

  const deduplicated = deduplicateNewsItems(normalized);
  report.duplicates = deduplicated.duplicates;
  report.normalized = deduplicated.items.length;

  const recentItems = deduplicated.items.filter((item) => isNewsWithinActiveWindow(item.published_at, now));
  report.recent = recentItems.length;
  report.skipped += deduplicated.items.length - recentItems.length;
  if (recentItems.length === 0) return report;

  let repository: NewsIngestionRepository;
  try {
    repository = options.repository ?? createSupabaseNewsRepository(createNewsIngestionSupabaseClient());
  } catch (error) {
    report.failed += 1;
    report.errors.push(errorMessage(error, "Supabase configuration is missing."));
    return report;
  }

  const existingByIdentity = new Map<string, ExistingNewsRow>();
  const failedSources = new Set<string>();
  const sourceNames = [...new Set(recentItems.map((item) => item.source))].sort();

  for (const source of sourceNames) {
    try {
      const sourceUrls = [...new Set(recentItems.filter((item) => item.source === source).map((item) => item.source_url))];
      const { rows, error } = await repository.listBySource(source, sourceUrls);
      if (error) {
        failedSources.add(source);
        report.failed += 1;
        report.errors.push(`Could not check existing news for ${source}: ${error}`);
        continue;
      }
      for (const row of rows) {
        if (row.source_url) existingByIdentity.set(newsIdentity(row.source, row.source_url), row);
      }
    } catch (error) {
      failedSources.add(source);
      report.failed += 1;
      report.errors.push(`Could not check existing news for ${source}: ${errorMessage(error, "unknown storage error")}`);
    }
  }

  const candidates: Candidate[] = [];
  for (const item of recentItems) {
    if (failedSources.has(item.source)) {
      report.skipped += 1;
      continue;
    }
    const existing = existingByIdentity.get(newsIdentity(item.source, item.source_url)) ?? null;
    const state = !existing ? "new" : hasMaterialNewsChange(existing, item) ? "updated" : "unchanged";
    candidates.push({ item, existing, state });
    report[state] += 1;
  }
  report.already_existing = report.updated + report.unchanged;

  const selectedItems = selectTopNewsItems(candidates.map((candidate) => candidate.item));
  const selectedIdentities = new Set(selectedItems.map((item) => newsIdentity(item.source, item.source_url)));
  const selectedCandidates = candidates.filter((candidate) => selectedIdentities.has(newsIdentity(candidate.item.source, candidate.item.source_url)));
  report.selected = selectedCandidates.length;
  report.not_selected = candidates.length - selectedCandidates.length;

  for (const candidate of candidates) {
    if (candidate.state !== "updated" || selectedIdentities.has(newsIdentity(candidate.item.source, candidate.item.source_url))) continue;
    if (candidate.existing) {
      await persistUpdate(repository, candidate.existing.id, {
        ...sourceFields(candidate.item),
        headline: null,
        summary_short: null,
      }, report);
    }
  }

  const isSummarizationConfigured = options.summarizationConfigured ?? isNewsSummarizationConfigured();
  const summarize = options.summarize ?? summarizeNews;
  for (const candidate of selectedCandidates) {
    if (candidate.state === "unchanged") {
      if (!candidate.existing || hasGeneratedNewsSummary(candidate.existing)) {
        report.reused += 1;
        continue;
      }

      const generated = await generateSummary(candidate.item, summarize, isSummarizationConfigured, report);
      if (generated) {
        await persistUpdate(repository, candidate.existing.id, generatedFields(generated), report);
      }
      continue;
    }

    const generated = await generateSummary(candidate.item, summarize, isSummarizationConfigured, report);
    if (candidate.state === "new") {
      await persistInsert(repository, [{
        ...sourceFields(candidate.item),
        headline: generated?.headline ?? null,
        summary_short: generated?.summary_short ?? null,
      }], report);
    } else if (candidate.existing) {
      await persistUpdate(repository, candidate.existing.id, {
        ...sourceFields(candidate.item),
        ...generatedFields(generated),
      }, report);
    }
  }

  return report;
}

function createEmptyReport(): NewsIngestionReport {
  return {
    fetched: 0,
    discovered: 0,
    normalized: 0,
    recent: 0,
    new: 0,
    updated: 0,
    unchanged: 0,
    selected: 0,
    not_selected: 0,
    already_existing: 0,
    inserted: 0,
    updatedRows: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    summarized: 0,
    summarization_skipped: 0,
    summarization_failed: 0,
    reused: 0,
  };
}

function createSupabaseNewsRepository(supabase: SupabaseClient<Database>): NewsIngestionRepository {
  return {
    async listBySource(source, sourceUrls) {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, summary, source, source_url, headline, summary_short, original_title, original_language, category, published_at")
        .eq("source", source)
        .in("source_url", sourceUrls);
      return { rows: (data ?? []) as ExistingNewsRow[], error: error?.message ?? null };
    },
    async insert(rows) {
      const { data, error } = await supabase.from("news").insert(rows).select("id");
      return { inserted: data?.length ?? 0, error: error?.message ?? null };
    },
    async update(id, values) {
      const { error } = await supabase.from("news").update(values).eq("id", id);
      return { error: error?.message ?? null };
    },
  };
}

async function generateSummary(
  item: NormalizedNewsItem,
  summarize: NonNullable<NewsIngestionOptions["summarize"]>,
  configured: boolean,
  report: NewsIngestionReport,
): Promise<NewsSummarizationResult | null> {
  if (!configured) {
    report.summarization_skipped += 1;
    return null;
  }

  try {
    const generated = await summarize({
      originalTitle: item.original_title,
      sourceDescription: item.summary,
      originalLanguage: item.original_language,
      sourceName: item.source,
    });
    if (!generated) {
      report.summarization_skipped += 1;
      return null;
    }
    report.summarized += 1;
    return generated;
  } catch (error) {
    report.failed += 1;
    report.summarization_failed += 1;
    report.errors.push(`Could not summarize "${item.original_title}": ${errorMessage(error, "unknown provider error")}`);
    return null;
  }
}

async function persistInsert(repository: NewsIngestionRepository, rows: NewsInsert[], report: NewsIngestionReport) {
  try {
    const { inserted, error } = await repository.insert(rows);
    if (error) {
      report.failed += rows.length;
      report.errors.push(`Could not insert news records: ${error}`);
      return;
    }
    report.inserted += inserted;
  } catch (error) {
    report.failed += rows.length;
    report.errors.push(`Could not insert news records: ${errorMessage(error, "unknown storage error")}`);
  }
}

async function persistUpdate(repository: NewsIngestionRepository, id: string, values: NewsUpdate, report: NewsIngestionReport) {
  try {
    const { error } = await repository.update(id, values);
    if (error) {
      report.failed += 1;
      report.errors.push(`Could not update news record ${id}: ${error}`);
      return;
    }
    report.updatedRows += 1;
  } catch (error) {
    report.failed += 1;
    report.errors.push(`Could not update news record ${id}: ${errorMessage(error, "unknown storage error")}`);
  }
}

function sourceFields(item: NormalizedNewsItem): NewsSourceFields {
  return {
    title: item.title,
    summary: item.summary,
    original_title: item.original_title,
    original_language: item.original_language,
    source: item.source,
    source_url: item.source_url,
    image_url: item.image_url,
    published_at: item.published_at,
    category: item.category,
  };
}

function generatedFields(generated: NewsSummarizationResult | null): NewsUpdate {
  return {
    headline: generated?.headline ?? null,
    summary_short: generated?.summary_short ?? null,
  };
}

function newsIdentity(source: string, sourceUrl: string): string {
  return `${source}\u0000${sourceUrl}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}