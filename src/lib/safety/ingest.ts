import type { SupabaseClient } from "@supabase/supabase-js";
import { createSafetyIngestionSupabaseClient } from "@/lib/safety/supabase";
import { extractChitralRelevantSafetyText, isChitralRelevantSafetyRecord } from "@/lib/safety/relevance";
import { applySafetyPolicy, getSafetyFreshnessDate, isSafetyEventExpiredAt, isSafetyEventFresh } from "@/lib/safety/policy";
import { buildSafetyBrief } from "@/lib/safety/brief";
import type { SafetyEventDraft, SafetyIngestionReport, SafetySourceAdapter } from "@/lib/safety/types";
import type { Database } from "@/lib/supabase/database.types";

type HazardRow = Database["public"]["Tables"]["hazards"]["Row"];
type HazardInsert = Database["public"]["Tables"]["hazards"]["Insert"];

type ExistingHazardRow = Pick<
  HazardRow,
  "id" | "title" | "description" | "source_name" | "source_url" | "source_type" | "type" | "status" | "reported_at" | "issued_at" | "expires_at"
>;

type SafetyIdentity = {
  sourceId: string | null;
  sourceUrl: string | null;
  fingerprint: string | null;
};

export async function ingestSafetySource(adapter: SafetySourceAdapter): Promise<SafetyIngestionReport> {
  const report: SafetyIngestionReport = {
    fetched: 0,
    normalized: 0,
    stale: 0,
    irrelevant: 0,
    duplicates_within_run: 0,
    duplicates_existing: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    rejected: 0,
    expired: 0,
    expiration_examples: [],
    failed: 0,
    errors: [],
  };

  const fetchedAt = new Date();
  let rawItems: unknown[];
  try {
    rawItems = await adapter.fetchItems();
  } catch (error) {
    report.failed += 1;
    report.errors.push(error instanceof Error ? error.message : "The source request failed.");
    return report;
  }

  report.fetched = rawItems.length;
  const normalizedCandidates: SafetyEventDraft[] = [];

  for (const rawItem of rawItems) {
    const item = adapter.normalizeItem(rawItem);
    if (!item) {
      report.skipped += 1;
      continue;
    }

    normalizedCandidates.push(item);
  }
  report.normalized = normalizedCandidates.length;

  const freshItems: SafetyEventDraft[] = [];
  for (const item of normalizedCandidates) {
    if (!isSafetyEventFresh(item, fetchedAt)) {
      report.stale += 1;
      continue;
    }
    freshItems.push(item);
  }

  const relevantItems: SafetyEventDraft[] = [];
  for (const item of freshItems) {
    if (!isChitralRelevantSafetyRecord({
      title: item.title,
      description: item.description,
      location_name: item.location_name,
    })) {
      report.irrelevant += 1;
      continue;
    }

    relevantItems.push({
      ...item,
      relevant_source_content: extractChitralRelevantSafetyText([item.title, item.description, item.location_name]),
    });
  }

  const deduplicatedItems = deduplicateSafetyItems(relevantItems, report);
  const acceptedItems: SafetyEventDraft[] = [];
  for (const item of deduplicatedItems) {
    const policyResult = applySafetyPolicy(item, fetchedAt);
    if (!policyResult) {
      report.stale += 1;
      continue;
    }

    if (isSafetyEventExpiredAt(policyResult.event)) report.expired += 1;
    if (report.expiration_examples.length < 3) {
      report.expiration_examples.push({
        title: policyResult.event.title,
        freshness_date: policyResult.freshnessDate,
        expires_at: policyResult.event.expires_at ?? "",
      });
    }
    acceptedItems.push(policyResult.event);
  }
  if (acceptedItems.length === 0) return report;

  let supabase: SupabaseClient<Database>;
  try {
    supabase = createSafetyIngestionSupabaseClient();
  } catch (error) {
    report.failed += 1;
    report.errors.push(error instanceof Error ? error.message : "Supabase configuration is missing.");
    return report;
  }

  const { data: existingRows, error: lookupError } = await supabase
    .from("hazards")
    .select("id, title, description, source_name, source_url, source_type, type, status, reported_at, issued_at, expires_at")
    .eq("source_name", adapter.name);

  if (lookupError) {
    report.failed += 1;
    report.errors.push(`Could not check existing hazard records: ${lookupError.message}`);
    return report;
  }

  const existingRowsByIdentity = buildExistingIdentityIndex((existingRows ?? []) as ExistingHazardRow[]);

  const inserts: HazardInsert[] = [];
  const updates: Array<{ row: HazardInsert; id: string }> = [];

  for (const item of acceptedItems) {
    const existing = findExistingHazard(item, existingRowsByIdentity);
    const hazardRow = await toHazardInsert(item);

    if (existing) {
      const shouldRefresh = shouldRefreshExistingRecord(existing, item, hazardRow);
      if (!shouldRefresh) {
        report.duplicates_existing += 1;
        report.skipped += 1;
        continue;
      }

      updates.push({ row: hazardRow, id: existing.id });
      continue;
    }

    inserts.push(hazardRow);
  }

  if (inserts.length > 0) {
    const { data, error: insertError } = await supabase.from("hazards").insert(inserts).select("id");
    if (insertError) {
      report.failed += inserts.length;
      report.errors.push(`Could not insert safety records: ${insertError.message}`);
      return report;
    }

    report.inserted = data?.length ?? inserts.length;
  }

  for (const { row, id } of updates) {
    const { error: updateError } = await supabase
      .from("hazards")
      .update(row)
      .eq("id", id);

    if (updateError) {
      report.failed += 1;
      report.errors.push(`Could not update safety record: ${updateError.message}`);
      continue;
    }

    report.updated += 1;
  }

  return report;
}

function deduplicateSafetyItems(items: SafetyEventDraft[], report: SafetyIngestionReport): SafetyEventDraft[] {
  const seen = new Map<string, SafetyEventDraft>();
  const deduplicated: SafetyEventDraft[] = [];

  for (const item of items) {
    const identity = getSafetyIdentity(item);
    const identityKeys = getIdentityKeys(identity);
    const existing = identityKeys.map((key) => seen.get(key)).find(Boolean);
    if (!existing || identityKeys.length === 0) {
      deduplicated.push(item);
      for (const key of identityKeys) seen.set(key, item);
      continue;
    }

    report.duplicates_within_run += 1;
    const preferred = preferNewerSafetyItem(existing, item);
    const index = deduplicated.indexOf(existing);
    if (index >= 0 && preferred !== existing) deduplicated[index] = preferred;
    for (const key of identityKeys) seen.set(key, preferred);
  }

  return deduplicated;
}

function getIdentityKeys(identity: SafetyIdentity): string[] {
  return [
    identity.sourceId ? `id:${identity.sourceId}` : null,
    identity.sourceUrl ? `url:${identity.sourceUrl}` : null,
    identity.fingerprint ? `fingerprint:${identity.fingerprint}` : null,
  ].filter((key): key is string => Boolean(key));
}

function getSafetyIdentity(item: SafetyEventDraft): SafetyIdentity {
  return {
    sourceId: item.source_id?.trim() || null,
    sourceUrl: item.source_url?.trim() || null,
    fingerprint: buildSafetyFingerprint(item),
  };
}

function buildSafetyFingerprint(item: Pick<SafetyEventDraft, "source_name" | "title" | "issued_at" | "published_at" | "reported_at">): string | null {
  const sourceName = item.source_name.trim().toLowerCase();
  const title = normalizeIdentityText(item.title);
  const sourceDate = item.issued_at ?? item.published_at ?? item.reported_at;
  if (!sourceName || !title || !sourceDate) return null;

  const parsedDate = new Date(sourceDate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return `${sourceName}|${title}|${parsedDate.toISOString()}`;
}

function buildExistingIdentityIndex(rows: ExistingHazardRow[]) {
  const byUrl = new Map<string, ExistingHazardRow>();
  const byFingerprint = new Map<string, ExistingHazardRow>();

  for (const row of rows) {
    const sourceUrl = row.source_url?.trim();
    if (sourceUrl) byUrl.set(`${row.source_name ?? row.source_type ?? "unknown"}|${sourceUrl}`, row);

    const fingerprint = buildSafetyFingerprint({
      source_name: row.source_name ?? row.source_type ?? "unknown",
      title: row.title ?? row.type,
      issued_at: row.issued_at,
      published_at: null,
      reported_at: row.reported_at,
    });
    if (fingerprint) byFingerprint.set(fingerprint, row);
  }

  return { byUrl, byFingerprint };
}

function findExistingHazard(item: SafetyEventDraft, index: ReturnType<typeof buildExistingIdentityIndex>): ExistingHazardRow | undefined {
  const identity = getSafetyIdentity(item);
  if (identity.sourceUrl) {
    const byUrl = index.byUrl.get(`${item.source_name}|${identity.sourceUrl}`);
    if (byUrl) return byUrl;
  }
  return identity.fingerprint ? index.byFingerprint.get(identity.fingerprint) : undefined;
}

function normalizeIdentityText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function preferNewerSafetyItem(existing: SafetyEventDraft, incoming: SafetyEventDraft): SafetyEventDraft {
  const existingDate = getSafetyFreshnessDate(existing);
  const incomingDate = getSafetyFreshnessDate(incoming);
  if (existingDate && incomingDate && new Date(incomingDate).getTime() > new Date(existingDate).getTime()) return incoming;
  if (!existing.description && incoming.description) return incoming;
  return existing;
}

function shouldRefreshExistingRecord(existing: ExistingHazardRow, incoming: SafetyEventDraft, incomingRow: HazardInsert): boolean {
  const incomingStatus = incoming.status ?? "unverified";
  const incomingIssuedAt = incoming.issued_at ?? null;
  const incomingExpiresAt = incoming.expires_at ?? null;

  if (existing.status !== incomingStatus) return true;
  if (existing.issued_at !== incomingIssuedAt) return true;
  if (existing.expires_at !== incomingExpiresAt) return true;

  const existingTitle = existing.title?.trim() ?? "";
  const incomingTitle = typeof incomingRow.title === "string" ? incomingRow.title.trim() : "";
  if (existingTitle !== incomingTitle) return true;

  const existingDescription = existing.description?.trim() ?? "";
  const incomingDescription = incomingRow.description.trim();
  if (existingDescription !== incomingDescription) return true;

  return false;
}

async function toHazardInsert(item: SafetyEventDraft): Promise<HazardInsert> {
  const brief = await buildSafetyBrief(item);

  return {
    type: item.event_type ?? "advisory",
    title: brief.headline,
    description: brief.summary,
    severity: item.severity ?? "medium",
    status: item.status ?? "unverified",
    source: item.source_name,
    source_name: item.source_name,
    source_url: item.source_url,
    source_type: item.source_type,
    location_name: item.location_name,
    latitude: item.latitude,
    longitude: item.longitude,
    reported_at: item.reported_at ?? item.issued_at ?? new Date().toISOString(),
    issued_at: item.issued_at,
    expires_at: item.expires_at,
  };
}

export { isChitralRelevantSafetyRecord };
