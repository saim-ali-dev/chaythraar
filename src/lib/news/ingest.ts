import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchChitralTimesItems, normalizeChitralTimesItem } from "@/lib/news/chitral-times";
import type { NewsIngestionReport, NormalizedNewsItem } from "@/lib/news/types";
import type { Database } from "@/lib/supabase/database.types";

const sourceName = "Chitral Times";

type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];

type NewsSourceRow = Pick<Database["public"]["Tables"]["news"]["Row"], "source_url">;

export async function ingestChitralTimes(): Promise<NewsIngestionReport> {
  const report: NewsIngestionReport = {
    discovered: 0,
    normalized: 0,
    inserted: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  };

  let rawItems: unknown[];
  try {
    rawItems = await fetchChitralTimesItems();
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "The RSS request failed.");
    return report;
  }

  report.discovered = rawItems.length;
  const normalizedItems: NormalizedNewsItem[] = [];
  const seenUrls = new Set<string>();

  for (const rawItem of rawItems) {
    const item = normalizeChitralTimesItem(rawItem);
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
    supabase = createIngestionSupabaseClient();
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Supabase configuration is missing.");
    return report;
  }

  const { data: existingRows, error: lookupError } = await supabase
    .from("news")
    .select("source_url")
    .eq("source", sourceName);

  if (lookupError) {
    report.errors.push(`Could not check existing news URLs: ${lookupError.message}`);
    return report;
  }

  const existingUrls = new Set((existingRows as NewsSourceRow[]).map((row) => row.source_url).filter((url): url is string => Boolean(url)));
  const newItems = normalizedItems.filter((item) => {
    if (existingUrls.has(item.source_url)) {
      report.duplicates += 1;
      return false;
    }
    return true;
  });

  if (newItems.length === 0) return report;

  const inserts: NewsInsert[] = newItems.map((item) => ({
    title: item.title,
    summary: item.summary,
    source: item.source,
    source_url: item.source_url,
    image_url: item.image_url,
    published_at: item.published_at,
    category: item.category,
  }));

  const { data, error: insertError } = await supabase.from("news").insert(inserts).select("id");
  if (insertError) {
    report.errors.push(`Could not insert news records: ${insertError.message}`);
    return report;
  }

  report.inserted = data?.length ?? 0;
  return report;
}

function createIngestionSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY before running news ingestion.");
  }

  return createClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
