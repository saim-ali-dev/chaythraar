import { normalizeSafetyEventDraft, type SafetyEventDraft, type SafetySourceAdapter } from "@/lib/safety/types";

const PMD_BASE_URL = "https://weather.gov.pk";
const PMD_PRESS_RELEASES_URL = `${PMD_BASE_URL}/nwfc/all-press-releases`;
const PMD_SOURCE_NAME = "PMD Pakistan Meteorological Department";
const MAX_PRESS_RELEASES = 12;

const SAFETY_CONDITION_PATTERN = /\b(?:warning|advisory|alert|flood|flash flood|heavy rain|rain[- ]wind|thunderstorm|thundershower|hailstorm|landslide|heat wave|cold wave|smog|cyclone|storm|avalanche|dust storm|gale|extreme weather|severe weather)\b/i;

export const pmdAdapter: SafetySourceAdapter = {
  name: PMD_SOURCE_NAME,
  source_type: "official",
  fetchItems: fetchPMDItems,
  normalizeItem: normalizePMDItem,
};

async function fetchPMDItems(): Promise<unknown[]> {
  const archiveResponse = await fetch(PMD_PRESS_RELEASES_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "CHAYTHRAAR-safety-ingestion/0.1",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!archiveResponse.ok) {
    throw new Error(`PMD press-release archive returned HTTP ${archiveResponse.status}.`);
  }

  const archiveHtml = await archiveResponse.text();
  const pressReleaseLinks = extractPressReleaseLinks(archiveHtml).slice(0, MAX_PRESS_RELEASES);
  const items: Array<Record<string, unknown>> = [];

  for (const sourceUrl of pressReleaseLinks) {
    const response = await fetch(sourceUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "CHAYTHRAAR-safety-ingestion/0.1",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) continue;

    const html = await response.text();
    const text = htmlToText(html);
    const title = extractPageTitle(html) || extractTitleFromText(text);
    if (!title || !SAFETY_CONDITION_PATTERN.test(`${title} ${text}`)) continue;

    items.push({
      title,
      description: text,
      source_name: PMD_SOURCE_NAME,
      source_url: sourceUrl,
      source_type: "official",
      issued_at: extractIssuedAt(text),
      expires_at: null,
      severity: detectSeverity(`${title} ${text}`),
      status: "unverified",
      location_name: extractLocationName(`${title} ${text}`),
      event_type: inferEventType(`${title} ${text}`),
      raw_source: html.slice(0, 12000),
    });
  }

  return items;
}

function extractPressReleaseLinks(html: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();
  const hrefRegex = /href=["']([^"']*\/nwfc\/all-press-releases\/\d+[^"']*)["']/gi;

  for (const match of html.matchAll(hrefRegex)) {
    const href = match[1]?.trim();
    if (!href) continue;

    const sourceUrl = new URL(href, PMD_BASE_URL).toString();
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);
    links.push(sourceUrl);
  }

  return links;
}

function extractPageTitle(html: string): string | null {
  const heading = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  const title = heading ? htmlToText(heading) : null;
  return title && !/^press releases?$/i.test(title) ? title : null;
}

function extractTitleFromText(text: string): string | null {
  const lines = text.split(" ").map((value) => value.trim()).filter(Boolean);
  const title = lines.find((value) => SAFETY_CONDITION_PATTERN.test(value));
  return title ?? null;
}

function htmlToText(html: string): string {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function extractIssuedAt(text: string): string | null {
  const dateMatch = text.match(/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i);
  if (!dateMatch) return null;

  const date = new Date(dateMatch[0]);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractLocationName(text: string): string | null {
  const locations = ["Chitral", "Upper Chitral", "Lower Chitral", "Drosh", "Mastuj", "Garam Chashma", "Bumburet", "Torkhow", "Ayun", "Khot", "Reshun"];
  return locations.find((location) => new RegExp(`\\b${location.replace(" ", "\\s+")}\\b`, "i").test(text)) ?? null;
}

function inferEventType(text: string): string {
  if (/flood|flash flood/i.test(text)) return "flood";
  if (/landslide/i.test(text)) return "landslide";
  if (/avalanche|snowfall|cold wave/i.test(text)) return "snowfall";
  if (/heat wave/i.test(text)) return "heatwave";
  if (/storm|thunderstorm|thundershower|rain[- ]wind|gale|hailstorm/i.test(text)) return "storm";
  if (/smog/i.test(text)) return "smog";
  return "advisory";
}

function detectSeverity(text: string): SafetyEventDraft["severity"] {
  if (/extreme|severe|flash flood|critical|emergency/i.test(text)) return "critical";
  if (/warning|heavy rain|flood|landslide|storm|heat wave|cold wave/i.test(text)) return "high";
  if (/advisory|alert|hailstorm|thundershower/i.test(text)) return "medium";
  return "low";
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/gi, "'")
    .trim();
}

export function normalizePMDItem(rawItem: unknown): SafetyEventDraft | null {
  if (!rawItem || typeof rawItem !== "object") return null;

  const item = rawItem as Record<string, unknown>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const sourceUrl = typeof item.source_url === "string" && item.source_url.trim() ? item.source_url.trim() : null;

  if (!title || !description || !sourceUrl || !SAFETY_CONDITION_PATTERN.test(`${title} ${description}`)) return null;

  const draft = normalizeSafetyEventDraft({
    event_type: typeof item.event_type === "string" ? item.event_type : "advisory",
    title,
    description: description.length > 4000 ? `${description.slice(0, 3997).trim()}...` : description,
    severity: item.severity as SafetyEventDraft["severity"],
    status: "unverified",
    source_name: PMD_SOURCE_NAME,
    source_url: sourceUrl,
    source_type: "official",
    location_name: typeof item.location_name === "string" ? item.location_name : null,
    latitude: null,
    longitude: null,
    issued_at: typeof item.issued_at === "string" ? item.issued_at : null,
    expires_at: null,
    raw_source: typeof item.raw_source === "string" ? item.raw_source : "",
  });

  return draft;
}
