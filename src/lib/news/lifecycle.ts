import type { NormalizedNewsItem } from "@/lib/news/types";

export const NEWS_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000;
export const NEWS_ACTIVE_LIMIT = 10;

export type ExistingNewsContent = Pick<
  NormalizedNewsItem,
  "title" | "summary" | "category" | "published_at"
> & {
  original_title: string | null;
  original_language: string | null;
};

export function getNewsActiveWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - NEWS_ACTIVE_WINDOW_MS);
}

export function isNewsWithinActiveWindow(publishedAt: string, now = new Date()): boolean {
  const publishedTime = Date.parse(publishedAt);
  return Number.isFinite(publishedTime) && publishedTime >= getNewsActiveWindowStart(now).getTime();
}

export function deduplicateNewsItems<T extends Pick<NormalizedNewsItem, "source" | "source_url">>(items: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];
  let duplicates = 0;

  for (const item of items) {
    const identity = `${item.source}\u0000${item.source_url}`;
    if (seen.has(identity)) {
      duplicates += 1;
      continue;
    }
    seen.add(identity);
    unique.push(item);
  }

  return { items: unique, duplicates };
}

export function hasGeneratedNewsSummary(item: Pick<NormalizedNewsItem, "headline" | "summary_short">): boolean {
  return Boolean(item.headline?.trim() && item.summary_short?.trim());
}

export function hasMaterialNewsChange(existing: ExistingNewsContent, candidate: NormalizedNewsItem): boolean {
  return normalizeText(existing.title) !== normalizeText(candidate.title)
    || normalizeText(existing.summary) !== normalizeText(candidate.summary)
    || normalizeText(existing.category) !== normalizeText(candidate.category)
    || normalizeText(existing.original_title ?? existing.title) !== normalizeText(candidate.original_title)
    || normalizeText(existing.original_language) !== normalizeText(candidate.original_language)
    || parseTimestamp(existing.published_at) !== parseTimestamp(candidate.published_at);
}

export function selectTopNewsItems<T extends Pick<NormalizedNewsItem, "published_at" | "source_url" | "source">>(items: T[], limit = NEWS_ACTIVE_LIMIT): T[] {
  return [...items]
    .sort((left, right) => parseTimestamp(right.published_at) - parseTimestamp(left.published_at)
      || compareText(left.source_url, right.source_url)
      || compareText(left.source, right.source))
    .slice(0, Math.max(0, limit));
}

function normalizeText(value: string | null): string {
  return value?.replace(/\s+/gu, " ").trim() ?? "";
}

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}