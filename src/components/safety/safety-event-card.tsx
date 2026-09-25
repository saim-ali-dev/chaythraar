import { ExternalLink, MapPin, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSafetyStatus, isSafetyEventExpired } from "@/types/safety";
import type { SafetyEvent } from "@/types/safety";

type SafetyEventCardProps = {
  event: SafetyEvent;
};

export function SafetyEventCard({ event }: SafetyEventCardProps) {
  const status = getSafetyStatus(event);
  const sourceType = sourceTypeLabel(event.source_type);
  const severityTone = event.severity === "critical" || event.severity === "high" ? "copper" : "neutral";

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-mist)] text-[var(--color-copper)]"><ShieldAlert className="size-5" /></span><div className="flex flex-wrap justify-end gap-2"><Badge tone={severityTone}>{event.severity}</Badge><Badge>{status}</Badge></div></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">{event.event_type}</p>
      <h2 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]">{event.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-slate)]">{event.description}</p>
      <div className="mt-auto border-t border-[var(--color-line)] pt-4"><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted)]"><span>{sourceType}</span><span>{event.source_name ?? "Source not listed"}</span><span>Issued {formatDate(event.issued_at)}</span>{event.expires_at && <span>{isSafetyEventExpired(event) ? "Expired" : `Expires ${formatDate(event.expires_at)}`}</span>}</div>{event.location_name && <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-slate)]"><MapPin className="size-3" />{event.location_name}</p>}{event.source_url && <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View source <ExternalLink className="size-4" /></a>}</div>
    </Card>
  );
}

function sourceTypeLabel(sourceType: SafetyEvent["source_type"]) {
  if (sourceType === "official") return "Official advisory";
  if (sourceType === "news") return "News report";
  if (sourceType === "community") return "Community report";
  return "Source unclassified";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
