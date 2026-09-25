import { createSafetyIngestionSupabaseClient } from "@/lib/safety/supabase";
import { normalizeSafetyEventDraft, type SafetyEventDraft, type SafetySourceAdapter } from "@/lib/safety/types";

type NewsRow = {
  id: string;
  title: string;
  summary: string | null;
  headline: string | null;
  summary_short: string | null;
  original_title: string | null;
  source: string;
  source_url: string | null;
  published_at: string;
  category: string;
};

type NewsSafetySourceName = "Chitral Times" | "ChitralToday";
const HAZARD_PATTERN = /\b(?:flood|flash flood|landslide|mudslide|rockfall|avalanche|earthquake|cloudburst|road (?:blocked|blockage|closure|closed)|bridge collapse|wall collapse|house collapse|accident|drown(?:ed|ing)|rescue operation|missing|stranded|evacuat(?:ed|ion)|casualt(?:y|ies)|fatalit(?:y|ies)|injur(?:y|ies)|washed away|destroyed|damage(?:d)?|displaced)\b/i;
const IMPACT_PATTERN = /\b(?:occurred|killed|died|injured|damaged|destroyed|blocked|closed|collapsed|drowned|rescued|missing|stranded|evacuated|washed away|displaced|affected|loss of life|casualt|fatalit|road closure)\b/i;
const ADMINISTRATIVE_ONLY_PATTERN = /\b(?:meeting|plan|policy|preparedness|contingency|training|workshop|review|announced|urged|directed|launch(?:ed|es)|campaign)\b/i;

export const chitralTimesSafetyAdapter = createNewsSafetyAdapter("Chitral Times");
export const chitralTodaySafetyAdapter = createNewsSafetyAdapter("ChitralToday");

function createNewsSafetyAdapter(sourceName: NewsSafetySourceName): SafetySourceAdapter {
  return {
    name: sourceName,
    source_type: "news",
    fetchItems: () => fetchNewsItems(sourceName),
    normalizeItem: normalizeNewsSafetyItem,
  };
}

async function fetchNewsItems(sourceName: string): Promise<unknown[]> {
  const supabase = createSafetyIngestionSupabaseClient();
  const { data, error } = await supabase
    .from("news")
    .select("id, title, summary, headline, summary_short, original_title, source, source_url, published_at, category")
    .eq("source", sourceName)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Could not load ${sourceName} news records: ${error.message}`);
  return data ?? [];
}

export function normalizeNewsSafetyItem(rawItem: unknown): SafetyEventDraft | null {
  if (!rawItem || typeof rawItem !== "object") return null;

  const item = rawItem as Partial<NewsRow>;
  const sourceName = typeof item.source === "string" ? item.source.trim() : "";
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const description = [item.summary_short, item.summary, item.headline, item.original_title]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim())
    .join(" ");
  const articleText = `${title} ${description}`;
  const sourceUrl = typeof item.source_url === "string" && item.source_url.trim() ? item.source_url.trim() : null;
  const publishedAt = typeof item.published_at === "string" && item.published_at.trim() ? item.published_at.trim() : null;

  if (!sourceName || !title || !description || !sourceUrl || !publishedAt) return null;
  if (!isSafetyNewsArticle(articleText)) return null;

  return normalizeSafetyEventDraft({
    source_id: typeof item.id === "string" ? item.id : null,
    event_type: inferNewsEventType(articleText),
    title,
    description,
    severity: null,
    status: "unverified",
    source_name: sourceName,
    source_url: sourceUrl,
    source_type: "news",
    location_name: extractKnownLocation(articleText),
    latitude: null,
    longitude: null,
    published_at: publishedAt,
    issued_at: publishedAt,
    expires_at: null,
    raw_source: JSON.stringify({ title, description, source: sourceName, source_url: sourceUrl }),
  });
}

function isSafetyNewsArticle(text: string): boolean {
  if (!HAZARD_PATTERN.test(text)) return false;
  return !ADMINISTRATIVE_ONLY_PATTERN.test(text) || IMPACT_PATTERN.test(text);
}

function inferNewsEventType(text: string): string {
  if (/flash flood|flood/i.test(text)) return "flood";
  if (/landslide|mudslide|rockfall/i.test(text)) return "landslide";
  if (/avalanche/i.test(text)) return "avalanche";
  if (/earthquake/i.test(text)) return "earthquake";
  if (/road (?:blocked|blockage|closure|closed)|bridge collapse|wall collapse|house collapse/i.test(text)) return "road blockage";
  if (/accident|drown|rescue|missing|stranded|casualt|fatalit|injur/i.test(text)) return "disaster incident";
  return "safety advisory";
}

function extractKnownLocation(text: string): string | null {
  const locations = ["Upper Chitral", "Lower Chitral", "Chitral", "Drosh", "Mastuj", "Garam Chashma", "Bumburet", "Torkhow", "Ayun", "Khot", "Reshun"];
  return locations.find((location) => new RegExp(`\\b${location.replace(" ", "\\s+")}\\b`, "i").test(text)) ?? null;
}
