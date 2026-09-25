export type SafetySourceType = "official" | "news" | "community";
export type SafetyStatus = "active" | "resolved" | "closed" | "expired" | "unverified";
export type SafetySeverity = "low" | "medium" | "high" | "critical";

export type SafetyEventDraft = {
  source_id?: string | null;
  relevant_source_content?: string | null;
  event_type: string | null;
  title: string;
  description: string;
  severity: SafetySeverity | null;
  status: SafetyStatus | null;
  source_name: string;
  source_url: string | null;
  source_type: SafetySourceType;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  published_at?: string | null;
  reported_at?: string | null;
  issued_at: string | null;
  expires_at: string | null;
  raw_source: string;
};

export type SafetySourceAdapter = {
  name: string;
  source_type: SafetySourceType;
  fetchItems: () => Promise<unknown[]>;
  normalizeItem: (rawItem: unknown) => SafetyEventDraft | null;
};

export type SafetyIngestionReport = {
  fetched: number;
  normalized: number;
  stale: number;
  irrelevant: number;
  duplicates_within_run: number;
  duplicates_existing: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  expired: number;
  expiration_examples: Array<{
    title: string;
    freshness_date: string;
    expires_at: string;
  }>;
  failed: number;
  errors: string[];
};

export function isSafetySourceType(value: unknown): value is SafetySourceType {
  return value === "official" || value === "news" || value === "community";
}

export function isSafetyStatus(value: unknown): value is SafetyStatus {
  return value === "active" || value === "resolved" || value === "closed" || value === "expired" || value === "unverified";
}

export function isSafetySeverity(value: unknown): value is SafetySeverity {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

export function normalizeSafetyEventDraft(input: Partial<SafetyEventDraft>): SafetyEventDraft | null {
  if (!input.title || !input.description || !input.source_name) {
    return null;
  }

  const sourceType = input.source_type;
  const status = input.status;
  const severity = input.severity;

  if (!sourceType || !isSafetySourceType(sourceType)) {
    return null;
  }

  if (status !== undefined && status !== null && !isSafetyStatus(status)) {
    return null;
  }

  if (severity !== undefined && severity !== null && !isSafetySeverity(severity)) {
    return null;
  }

  const normalizedTitle = input.title.trim();
  const normalizedDescription = input.description.trim();
  const normalizedSourceName = input.source_name.trim();

  if (!normalizedTitle || !normalizedDescription || !normalizedSourceName) {
    return null;
  }

  const issuedAt = typeof input.issued_at === "string" && input.issued_at.trim() ? input.issued_at.trim() : null;
  if (issuedAt && Number.isNaN(new Date(issuedAt).getTime())) {
    return null;
  }

  const publishedAt = typeof input.published_at === "string" && input.published_at.trim() ? input.published_at.trim() : null;
  if (publishedAt && Number.isNaN(new Date(publishedAt).getTime())) {
    return null;
  }

  const reportedAt = typeof input.reported_at === "string" && input.reported_at.trim() ? input.reported_at.trim() : null;
  if (reportedAt && Number.isNaN(new Date(reportedAt).getTime())) {
    return null;
  }

  const expiresAt = typeof input.expires_at === "string" && input.expires_at.trim() ? input.expires_at.trim() : null;
  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    return null;
  }

  return {
    source_id: typeof input.source_id === "string" && input.source_id.trim() ? input.source_id.trim() : null,
    relevant_source_content: typeof input.relevant_source_content === "string" && input.relevant_source_content.trim() ? input.relevant_source_content.trim() : null,
    event_type: typeof input.event_type === "string" && input.event_type.trim() ? input.event_type.trim() : null,
    title: normalizedTitle,
    description: normalizedDescription,
    severity: severity ?? null,
    status: status ?? null,
    source_name: normalizedSourceName,
    source_url: input.source_url?.trim() ? input.source_url.trim() : null,
    source_type: sourceType,
    location_name: input.location_name?.trim() || null,
    latitude: typeof input.latitude === "number" && Number.isFinite(input.latitude) ? input.latitude : null,
    longitude: typeof input.longitude === "number" && Number.isFinite(input.longitude) ? input.longitude : null,
    published_at: publishedAt,
    reported_at: reportedAt,
    issued_at: issuedAt,
    expires_at: expiresAt,
    raw_source: input.raw_source?.trim() || "",
  };
}
