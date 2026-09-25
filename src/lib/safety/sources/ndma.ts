import type { SafetyEventDraft, SafetySourceAdapter } from "@/lib/safety/types";

const NDMA_BASE_URL = "https://www.ndma.gov.pk";
const NDMA_PUBLIC_PAGES = [
  `${NDMA_BASE_URL}/advisories`,
  `${NDMA_BASE_URL}/alerts`,
  `${NDMA_BASE_URL}/sitreps`,
  `${NDMA_BASE_URL}/news`,
];

export const ndmaAdapter: SafetySourceAdapter = {
  name: "NDMA Pakistan",
  source_type: "official",
  fetchItems: fetchNDMAItems,
  normalizeItem: normalizeNDMAItem,
};

async function fetchNDMAItems(): Promise<unknown[]> {
  const itemMap = new Map<string, Record<string, unknown>>();

  for (const pageUrl of NDMA_PUBLIC_PAGES) {
    const response = await fetch(pageUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "CHAYTHRAAR-safety-ingestion/0.1",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) continue;

    const html = await response.text();
    const pageItems = extractNDMAPublicCandidates(html, pageUrl);
    for (const item of pageItems) {
      const key = String(item.source_url ?? item.title ?? "");
      if (key) itemMap.set(key, item);
    }
  }

  return Array.from(itemMap.values());
}

function extractNDMAPublicCandidates(html: string, pageUrl: string): Array<Record<string, unknown>> {
  const candidates: Array<Record<string, unknown>> = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  const seen = new Set<string>();

  for (const match of html.matchAll(hrefRegex)) {
    const href = match[1]?.trim();
    if (!href) continue;

    const canonicalUrl = normalizeCandidateUrl(href, pageUrl);
    if (!canonicalUrl) continue;
    if (seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);

    const title = buildTitleFromUrl(canonicalUrl);
    const description = extractDescriptionFromHtml(html);
    const publishedAt = extractPublishedDateFromHtml(html);
    const expiryAt = extractExpiryDateFromHtml(html);
    const severity = detectSeverity(title, description);

    candidates.push({
      title,
      description,
      source_url: canonicalUrl,
      source_name: "NDMA Pakistan",
      source_type: "official",
      issued_at: publishedAt,
      expires_at: expiryAt,
      severity,
      status: "unverified",
      location_name: extractLocationName(title, description),
      event_type: inferEventType(title, description),
      raw_source: html.slice(0, 4000),
    });
  }

  return candidates.filter((item) => typeof item.title === "string" && item.title.length > 0);
}

function normalizeCandidateUrl(href: string, pageUrl: string): string | null {
  const candidate = href.trim();
  if (!candidate || candidate.startsWith("mailto:") || candidate.startsWith("tel:")) return null;

  try {
    const url = new URL(candidate, pageUrl);
    if (!url.hostname.endsWith("ndma.gov.pk")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function buildTitleFromUrl(url: string) {
  const pathname = new URL(url).pathname;
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return "NDMA public advisory";
  return decodeURIComponent(segment).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "NDMA public advisory";
}

function extractDescriptionFromHtml(html: string): string | null {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const descriptionSource = findMetaDescription(html) || cleaned;
  if (!descriptionSource) return null;
  return descriptionSource.length > 240 ? `${descriptionSource.slice(0, 237).trim()}...` : descriptionSource;
}

function findMetaDescription(html: string): string | null {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  return match ? decodeHtml(match[1]) : null;
}

function extractPublishedDateFromHtml(html: string): string | null {
  const metaMatch = html.match(/<meta[^>]+(property|name)=["'](?:article:published_time|publishdate|pubdate)["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(property|name)=["'](?:article:published_time|publishdate|pubdate)["'][^>]*>/i);
  const matched = metaMatch?.[2] ?? metaMatch?.[1];
  if (matched) {
    const iso = normalizeDateString(matched);
    if (iso) return iso;
  }

  const genericDate = html.match(/\b(?:\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\b/);
  if (genericDate?.[0]) {
    const iso = normalizeDateString(genericDate[0]);
    if (iso) return iso;
  }

  return null;
}

function extractExpiryDateFromHtml(html: string): string | null {
  const match = html.match(/(?:expires?|valid until|until|deadline)[^0-9]{0,20}(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/i);
  if (!match?.[1]) return null;
  return normalizeDateString(match[1]);
}

function extractLocationName(title: string, description: string | null): string | null {
  const text = `${title} ${description ?? ""}`;
  const locationPatterns = [
    /Pakistan/i,
    /Khyber Pakhtunkhwa/i,
    /Gilgit-Baltistan/i,
    /Balochistan/i,
    /Sindh/i,
    /Punjab/i,
    /Islamabad/i,
    /Chitral/i,
    /District/i,
    /Province/i,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return null;
}

function inferEventType(title: string, description: string | null): string | null {
  const value = `${title} ${description ?? ""}`.toLowerCase();
  if (/(flood|flash flood)/i.test(value)) return "flood";
  if (/(landslide|mudflow|rockfall)/i.test(value)) return "landslide";
  if (/(heatwave|temperature)/i.test(value)) return "heatwave";
  if (/(rain|storm|gale|wind)/i.test(value)) return "storm";
  if (/(snow|snowfall|avalanche)/i.test(value)) return "snowfall";
  if (/(earthquake|tremor)/i.test(value)) return "earthquake";
  if (/(warning|alert|advisory)/i.test(value)) return "advisory";
  return "advisory";
}

function detectSeverity(title: string, description: string | null): SafetyEventDraft["severity"] {
  const value = `${title} ${description ?? ""}`.toLowerCase();

  if (/critical|emergency|severe/i.test(value)) return "critical";
  if (/warning|alert|high/i.test(value)) return "high";
  if (/caution|watch|moderate|medium/i.test(value)) return "medium";
  if (/advisory|monitor|low/i.test(value)) return "low";
  return null;
}

function normalizeDateString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) return isoCandidate.toISOString();

  const formatMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (formatMatch) {
    const year = formatMatch[1];
    const month = formatMatch[2];
    const day = formatMatch[3];
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const namedDate = new Date(trimmed.replace(/(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})/, "$2 $1, $3"));
  if (!Number.isNaN(namedDate.getTime())) return namedDate.toISOString();

  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function normalizeNDMAItem(rawItem: unknown): SafetyEventDraft | null {
  if (!rawItem || typeof rawItem !== "object") return null;

  const item = rawItem as Record<string, unknown>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const sourceName = typeof item.source_name === "string" ? item.source_name.trim() : "NDMA Pakistan";

  if (!title || !description) return null;

  const severityCandidate = item.severity;
  const statusCandidate = item.status;

  const severity = severityCandidate === "low" || severityCandidate === "medium" || severityCandidate === "high" || severityCandidate === "critical"
    ? severityCandidate
    : null;

  const status = statusCandidate === "active" || statusCandidate === "resolved" || statusCandidate === "closed" || statusCandidate === "expired" || statusCandidate === "unverified"
    ? statusCandidate
    : "unverified";

  const sourceUrl = typeof item.source_url === "string" && item.source_url.trim() ? item.source_url.trim() : null;
  const issuedAt = typeof item.issued_at === "string" && item.issued_at.trim() ? item.issued_at.trim() : null;
  const expiresAt = typeof item.expires_at === "string" && item.expires_at.trim() ? item.expires_at.trim() : null;

  return {
    event_type: typeof item.event_type === "string" && item.event_type.trim() ? item.event_type.trim() : null,
    title,
    description,
    severity,
    status,
    source_name: sourceName,
    source_url: sourceUrl,
    source_type: "official",
    location_name: typeof item.location_name === "string" && item.location_name.trim() ? item.location_name.trim() : null,
    latitude: typeof item.latitude === "number" && Number.isFinite(item.latitude) ? item.latitude : null,
    longitude: typeof item.longitude === "number" && Number.isFinite(item.longitude) ? item.longitude : null,
    issued_at: issuedAt,
    expires_at: expiresAt,
    raw_source: typeof item.raw_source === "string" ? item.raw_source : "",
  };
}
