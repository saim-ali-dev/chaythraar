export type SafetySourceType = "official" | "news" | "community";
export type SafetyStatus = "active" | "resolved" | "closed" | "expired" | "unverified";
export type SafetySeverity = "low" | "medium" | "high" | "critical";

export type SafetyEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  severity: SafetySeverity | string;
  status: SafetyStatus | string;
  source_name: string | null;
  source_url: string | null;
  source_type: SafetySourceType | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  issued_at: string;
  expires_at: string | null;
  created_at: string;
};

export function isSafetyEventExpired(event: Pick<SafetyEvent, "expires_at">, now = new Date()) {
  if (!event.expires_at) return false;
  const expiresAt = new Date(event.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < now.getTime();
}

export function getSafetyStatus(event: SafetyEvent, now = new Date()) {
  return isSafetyEventExpired(event, now) ? "expired" : event.status;
}
