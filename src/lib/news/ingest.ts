import type { SupabaseClient } from "@supabase/supabase-js";
import { chitralTodayAdapter } from "@/lib/news/sources/chitral-today";
import { detectOriginalLanguage, fetchChitralTimesItems, normalizeChitralTimesItem } from "@/lib/news/chitral-times";
import { isNewsSummarizationConfigured, summarizeNews } from "@/lib/news/summarize-core";
import { createNewsIngestionSupabaseClient } from "@/lib/news/supabase";
import type { NewsIngestionReport, NewsSourceAdapter, NormalizedNewsItem } from "@/lib/news/types";
import type { Database } from "@/lib/supabase/database.types";

const chitralTimesAdapter: NewsSourceAdapter = {
  name: "Chitral Times",
  fetchItems: fetchChitralTimesItems,
  normalizeItem: normalizeChitralTimesItem,
};

type NewsRow = Database["public"]["Tables"]["news"]["Row"];
type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
type ExistingNewsRow = Pick<NewsRow, "id" | "title" | "summary" | "source" | "source_url" | "headline" | "summary_short" | "original_title" | "original_language">;

export async function ingestChitralTimes(): Promise<NewsIngestionReport> {
  return ingestNewsSource(chitralTimesAdapter);
}

export async function ingestChitralToday(): Promise<NewsIngestionReport> {
  return ingestNewsSource(chitralTodayAdapter);
}

export async function ingestNewsSource(adapter: NewsSourceAdapter): Promise<NewsIngestionReport> {
  const sourceName = adapter.name;
  const report: NewsIngestionReport = {
    discovered: 0,
    normalized: 0,
    new: 0,
    already_existing: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    summarized: 0,
    summarization_skipped: 0,
    summarization_failed: 0,
  };

  let rawItems: unknown[];
  try {
    rawItems = await adapter.fetchItems();
  } catch (error) {
    report.failed += 1;
    report.errors.push(error instanceof Error ? error.message : "The RSS request failed.");
    return report;
  }

  report.discovered = rawItems.length;
  const normalizedItems: NormalizedNewsItem[] = [];
  const seenUrls = new Set<string>();

  for (const rawItem of rawItems) {
    const item = adapter.normalizeItem(rawItem);
    if (!item) {
      report.skipped += 1;
      continue;
    }
    if (seenUrls.has(item.source_url)) {
      report.duplicates += 1;
      continue;
    }
    seenUrls.add(item.source_url);
    normalizedItems.push(item);
  }
  report.normalized = normalizedItems.length;

  if (normalizedItems.length === 0) return report;

  let supabase: SupabaseClient<Database>;
  try {
    supabase = createNewsIngestionSupabaseClient();
  } catch (error) {
    report.failed += 1;
    report.errors.push(error instanceof Error ? error.message : "Supabase configuration is missing.");
    return report;
  }

  const { data: existingRows, error: lookupError } = await supabase
    .from("news")
    .select("id, title, summary, source, source_url, headline, summary_short, original_title, original_language")
    .eq("source", sourceName);

  if (lookupError) {
    report.failed += 1;
    report.errors.push(`Could not check existing news URLs: ${lookupError.message}`);
    return report;
  }

  const existingByUrl = new Map(
    ((existingRows ?? []) as ExistingNewsRow[])
      .filter((row): row is ExistingNewsRow & { source_url: string } => Boolean(row.source_url))
      .map((row) => [row.source_url, row]),
  );
  const newItems = normalizedItems.filter((item) => !existingByUrl.has(item.source_url));
  const existingItems = normalizedItems.filter((item) => existingByUrl.has(item.source_url));
  const pendingExistingItems = existingItems.filter((item) => {
    const existing = existingByUrl.get(item.source_url);
    return Boolean(existing && (!existing.headline || !existing.summary_short));
  });

  report.new = newItems.length;
  report.already_existing = existingItems.length;

  for (const item of newItems) {
    await summarizeNewItem(item, report);
  }

  for (const item of pendingExistingItems) {
    const existing = existingByUrl.get(item.source_url);
    if (existing) await summarizeExistingItem(existing, report);
  }

  if (newItems.length === 0) return report;

  const inserts: NewsInsert[] = newItems.map((item) => ({
    title: item.title,
    summary: item.summary,
    headline: item.headline,
    summary_short: item.summary_short,
    original_title: item.original_title,
    original_language: item.original_language,
    source: item.source,
    source_url: item.source_url,
    image_url: item.image_url,
    published_at: item.published_at,
    category: item.category,
  }));

  const { data, error: insertError } = await supabase.from("news").insert(inserts).select("id");
  if (insertError) {
    report.failed += newItems.length;
    report.errors.push(`Could not insert news records: ${insertError.message}`);
    return report;
  }

  report.inserted = data?.length ?? 0;
  return report;
}

async function summarizeNewItem(item: NormalizedNewsItem, report: NewsIngestionReport) {
  if (!isNewsSummarizationConfigured()) {
    report.summarization_skipped += 1;
    return;
  }

  try {
    const generated = await summarizeNews({
      originalTitle: item.original_title,
      sourceDescription: item.summary,
      originalLanguage: item.original_language,
      sourceName: item.source,
    });
    if (!generated) {
      report.summarization_skipped += 1;
      return;
    }
    item.headline = generated.headline;
    item.summary_short = generated.summary_short;
    report.summarized += 1;
  } catch (error) {
    report.summarization_failed += 1;
    report.errors.push(`Could not summarize "${item.original_title}": ${error instanceof Error ? error.message : "unknown provider error"}`);
  }
}

async function summarizeExistingItem(existing: ExistingNewsRow, report: NewsIngestionReport) {
  if (!isNewsSummarizationConfigured()) {
    report.summarization_skipped += 1;
    return;
  }

  const originalTitle = existing.original_title ?? existing.title;
  try {
    const generated = await summarizeNews({
      originalTitle,
      sourceDescription: existing.summary,
      originalLanguage: existing.original_language ?? detectOriginalLanguage(originalTitle),
      sourceName: existing.source,
    });
    if (!generated) {
      report.summarization_skipped += 1;
      return;
    }

    const supabase = createNewsIngestionSupabaseClient();
    const { error } = await supabase
      .from("news")
      .update({ headline: generated.headline, summary_short: generated.summary_short })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    report.summarized += 1;
  } catch (error) {
    report.summarization_failed += 1;
    report.failed += 1;
    report.errors.push(`Could not summarize "${originalTitle}": ${error instanceof Error ? error.message : "unknown provider error"}`);
  }
}
