import type { SafetyEventDraft } from "@/lib/safety/types";

const FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type SafetyPolicyResult = {
  event: SafetyEventDraft;
  freshnessDate: string;
  usedDefaultExpiry: boolean;
};

export function applySafetyPolicy(event: SafetyEventDraft, fetchedAt = new Date(), now = fetchedAt): SafetyPolicyResult | null {
  const freshnessDate = getSafetyFreshnessDate(event, fetchedAt);
  if (!freshnessDate) return null;

  if (!isSafetyEventFresh(event, fetchedAt, now)) return null;

  const explicitExpiry = event.expires_at ? new Date(event.expires_at) : null;
  if (explicitExpiry && !Number.isNaN(explicitExpiry.getTime())) {
    return { event, freshnessDate, usedDefaultExpiry: false };
  }

  const expiryBase = new Date(freshnessDate);
  const expiresAt = new Date(expiryBase.getTime() + getSafetyDefaultTtlMs(event));
  return {
    event: { ...event, expires_at: expiresAt.toISOString() },
    freshnessDate,
    usedDefaultExpiry: true,
  };
}

export function isSafetyEventFresh(event: SafetyEventDraft, fetchedAt = new Date(), now = fetchedAt): boolean {
  const freshnessDate = getSafetyFreshnessDate(event, fetchedAt);
  if (!freshnessDate) return false;

  const freshnessTime = new Date(freshnessDate).getTime();
  return freshnessTime >= now.getTime() - FRESHNESS_WINDOW_MS;
}

export function getSafetyFreshnessDate(event: SafetyEventDraft, fetchedAt = new Date()): string | null {
  const candidates = [event.issued_at, event.published_at, event.reported_at, fetchedAt.toISOString()];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

export function getSafetyDefaultTtlMs(event: Pick<SafetyEventDraft, "event_type" | "source_type">): number {
  const eventType = event.event_type?.toLowerCase() ?? "";

  if (event.source_type === "community") return 24 * 60 * 60 * 1000;
  if (event.source_type === "news") return 48 * 60 * 60 * 1000;
  if (/travel|safety\s+warning|travel\s+warning/.test(eventType)) return 48 * 60 * 60 * 1000;
  if (/landslide|road\s+blockage|road\s+closure/.test(eventType)) return 72 * 60 * 60 * 1000;
  if (/incident|disaster/.test(eventType)) return 72 * 60 * 60 * 1000;
  if (/flash\s*flood|flood|glof|warning|advisory|severe\s+weather|heavy\s+rain|rainfall/.test(eventType)) return 24 * 60 * 60 * 1000;

  return 48 * 60 * 60 * 1000;
}

export function isSafetyEventExpiredAt(event: Pick<SafetyEventDraft, "expires_at">, now = new Date()): boolean {
  if (!event.expires_at) return false;
  const expiresAt = new Date(event.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime();
}
