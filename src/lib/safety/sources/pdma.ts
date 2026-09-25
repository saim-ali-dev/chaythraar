import { normalizeSafetyEventDraft, type SafetyEventDraft, type SafetySourceAdapter } from "@/lib/safety/types";

const PDMA_BASE_URL = "https://rms.pdma.gov.pk";
const PDMA_DSR_INDEX_URL = `${PDMA_BASE_URL}/DSRs.aspx`;
const PDMA_SOURCE_NAME = "PDMA Khyber Pakhtunkhwa";
const MAX_REPORTS = 12;

const SAFETY_CONTENT_PATTERN = /\b(?:flood|flash flood|glof|landslide|heavy rain|thunderstorm|cloudburst|earthquake|avalanche|road blockage|wall collapse|fire incident|accident|casualt(?:y|ies)|fatalit(?:y|ies)|injur(?:y|ies)|damage|incident|emergency|disaster|evacuat(?:e|ion))\b/i;

export const pdmaAdapter: SafetySourceAdapter = {
  name: PDMA_SOURCE_NAME,
  source_type: "official",
  fetchItems: fetchPDMAItems,
  normalizeItem: normalizePDMAItem,
};

async function fetchPDMAItems(): Promise<unknown[]> {
  const indexResponse = await fetch(PDMA_DSR_INDEX_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "CHAYTHRAAR-safety-ingestion/0.1",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!indexResponse.ok) {
    throw new Error(`PDMA daily situation report index returned HTTP ${indexResponse.status}.`);
  }

  const indexHtml = await indexResponse.text();
  const reportUrls = extractReportUrls(indexHtml).slice(0, MAX_REPORTS);
  const items: Array<Record<string, unknown>> = [];

  for (const sourceUrl of reportUrls) {
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
    const reportNumber = extractReportNumber(text) ?? sourceUrl;
    const eventType = inferEventType(text);

    items.push({
      title: `PDMA KP ${eventType} situation report`,
      description: text,
      source_name: PDMA_SOURCE_NAME,
      source_url: sourceUrl,
      source_type: "official",
      issued_at: extractIssuedAt(text),
      expires_at: null,
      severity: detectSeverity(text),
      status: "unverified",
      location_name: extractLocationName(text),
      event_type: eventType,
      report_number: reportNumber,
      raw_source: html.slice(0, 16000),
    });
  }

  return items;
}

function extractReportUrls(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const hrefRegex = /href=["']([^"']*\/ViewDSR\.aspx\?DSRID=\d+[^"']*)["']/gi;

  for (const match of html.matchAll(hrefRegex)) {
    const href = match[1]?.trim();
    if (!href) continue;

    const sourceUrl = new URL(href, PDMA_BASE_URL).toString();
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);
    urls.push(sourceUrl);
  }

  return urls;
}

function htmlToText(html: string): string {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function extractReportNumber(text: string): string | null {
  const match = text.match(/PDMA\/PEOC\/DSR\/[A-Z0-9/.-]+/i);
  return match?.[0] ?? null;
}

function extractIssuedAt(text: string): string | null {
  const dateMatch = text.match(/Date:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!dateMatch) return null;

  const [, day, month, year] = dateMatch;
  const date = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractLocationName(text: string): string | null {
  const locations = ["Upper Chitral", "Lower Chitral", "Chitral", "Drosh", "Mastuj", "Garam Chashma", "Bumburet", "Torkhow", "Ayun", "Khot", "Reshun"];
  return locations.find((location) => new RegExp(`\\b${location.replace(" ", "\\s+")}\\b`, "i").test(text)) ?? null;
}

function inferEventType(text: string): string {
  if (/glof|glacial lake outburst/i.test(text)) return "glof";
  if (/flash flood|flood/i.test(text)) return "flood";
  if (/landslide|mudslide|rockfall/i.test(text)) return "landslide";
  if (/earthquake|tremor/i.test(text)) return "earthquake";
  if (/avalanche|snowfall/i.test(text)) return "avalanche";
  if (/road blockage|road blocked|wall collapse|building collapse/i.test(text)) return "infrastructure incident";
  if (/fire incident/i.test(text)) return "fire";
  if (/accident/i.test(text)) return "accident";
  return "disaster incident";
}

function detectSeverity(text: string): SafetyEventDraft["severity"] {
  if (/death|fatalit|flash flood|glof|major damage|emergency/i.test(text)) return "critical";
  if (/flood|landslide|earthquake|avalanche|road blockage|injur|heavy rain|collapse/i.test(text)) return "high";
  if (/incident|damage|warning|advisory/i.test(text)) return "medium";
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

export function normalizePDMAItem(rawItem: unknown): SafetyEventDraft | null {
  if (!rawItem || typeof rawItem !== "object") return null;

  const item = rawItem as Record<string, unknown>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const sourceUrl = typeof item.source_url === "string" && item.source_url.trim() ? item.source_url.trim() : null;

  if (!title || !description || !sourceUrl || !SAFETY_CONTENT_PATTERN.test(description)) return null;

  return normalizeSafetyEventDraft({
    event_type: typeof item.event_type === "string" ? item.event_type : "disaster incident",
    title,
    description: description.length > 5000 ? `${description.slice(0, 4997).trim()}...` : description,
    severity: item.severity as SafetyEventDraft["severity"],
    status: "unverified",
    source_name: PDMA_SOURCE_NAME,
    source_url: sourceUrl,
    source_type: "official",
    location_name: typeof item.location_name === "string" ? item.location_name : null,
    latitude: null,
    longitude: null,
    issued_at: typeof item.issued_at === "string" ? item.issued_at : null,
    expires_at: null,
    raw_source: typeof item.raw_source === "string" ? item.raw_source : "",
  });
}
