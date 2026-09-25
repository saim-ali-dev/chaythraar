import { XMLParser } from "fast-xml-parser";
import { detectOriginalLanguage } from "@/lib/news/chitral-times";
import type { NewsSourceAdapter, NormalizedNewsItem } from "@/lib/news/types";

const CHITRAL_TODAY_RSS_URL = "https://chitraltoday.net/feed/";
const parser = new XMLParser({ ignoreAttributes: false, processEntities: true });

type RssCategory = string | { "#text"?: string };

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  category?: RssCategory | RssCategory[];
  description?: string;
};

type ParsedFeed = {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
};

export const chitralTodayAdapter: NewsSourceAdapter = {
  name: "ChitralToday",
  fetchItems: fetchChitralTodayItems,
  normalizeItem: normalizeChitralTodayItem,
};

async function fetchChitralTodayItems(): Promise<unknown[]> {
  const response = await fetch(CHITRAL_TODAY_RSS_URL, {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml",
      "user-agent": "CHAYTHRAAR-news-ingestion/0.1",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`RSS request returned HTTP ${response.status}.`);

  const feed = parser.parse(await response.text()) as ParsedFeed;
  const items = feed.rss?.channel?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function normalizeChitralTodayItem(rawItem: unknown): NormalizedNewsItem | null {
  if (!isRssItem(rawItem)) return null;

  const title = cleanText(rawItem.title);
  const sourceUrl = normalizeUrl(rawItem.link);
  const publishedAt = parseDate(rawItem.pubDate);
  if (!title || !sourceUrl || !publishedAt) return null;

  return {
    title,
    summary: summarizeDescription(rawItem.description),
    headline: null,
    summary_short: null,
    original_title: title,
    original_language: detectOriginalLanguage(title),
    source: "ChitralToday",
    source_url: sourceUrl,
    image_url: null,
    published_at: publishedAt,
    category: normalizeCategory(rawItem.category),
  };
}

function isRssItem(value: unknown): value is RssItem {
  return typeof value === "object" && value !== null;
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function summarizeDescription(value: string | undefined) {
  if (!value) return null;

  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/The post.*$/i, "")
    .replace(/appeared first on.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;
  if (text.length <= 280) return text;

  const shortened = text.slice(0, 277).trimEnd();
  const lastSpace = shortened.lastIndexOf(" ");
  return `${lastSpace > 180 ? shortened.slice(0, lastSpace) : shortened}...`;
}

function normalizeCategory(value: RssCategory | RssCategory[] | undefined) {
  const categories = (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => typeof item === "string" ? item : item["#text"] ?? "")
    .map(cleanText)
    .filter(Boolean);
  const meaningfulCategory = categories.find((item) => !["Latest News", "News"].includes(item));
  return meaningfulCategory ?? "News";
}
