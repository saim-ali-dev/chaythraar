import { ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { SafetyReportVoting } from "@/components/safety/safety-report-voting";
import { getSafetyStatus, isSafetyEventExpired } from "@/types/safety";
import type { SafetyEvent } from "@/types/safety";

type SafetyEventCardProps = {
  event: SafetyEvent;
};

export function SafetyEventCard({ event }: SafetyEventCardProps) {
  const status = getSafetyStatus(event);
  const sourceType = sourceTypeLabel(event.source_type);
  const severity = event.severity.toLowerCase();
  const severityTone = severity === "critical" ? "critical" : severity === "high" ? "high" : "neutral";
  const severityBorder = severity === "critical"
    ? "border-l-[var(--color-danger-deep)]"
    : severity === "high"
      ? "border-l-[var(--color-caution-deep)]"
      : "border-l-[var(--color-line-strong)]";

  return (
    <Card className={`min-w-0 flex h-full flex-col border-l-4 p-5 sm:p-6 ${severityBorder}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={severityTone}>Severity · {event.severity}</Badge>
        <Badge>{status === "active" ? "Status · Active" : `Status · ${status}`}</Badge>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{event.event_type}</p>
      <h2 className="mt-2 text-xl font-semibold leading-7 text-[var(--color-ink)]">{event.title}</h2>
      {event.source_type === "community" && <MediaFrame src={event.image_url ?? null} alt={`Photo for ${event.title}`} fallbackTitle={event.title} fallbackDetail={event.event_type} className="mt-4 aspect-[16/9] border border-[var(--color-line)]" sizes="(max-width: 1024px) 100vw, 33vw" />}
      <p className={`mt-3 text-sm leading-6 text-[var(--color-slate)] ${event.description.length > 400 ? "line-clamp-5" : ""}`}>{event.description}</p>
      {event.description.length > 400 && <details className="mt-2 text-sm"><summary className="min-h-10 cursor-pointer py-2 font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Show full description</summary><p className="whitespace-pre-wrap pt-2 text-sm leading-6 text-[var(--color-slate)]">{event.description}</p></details>}
      {event.additional_details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-slate)]">{event.additional_details}</p>}
      <dl className="mt-auto grid gap-3 border-t border-[var(--color-line)] pt-4 text-xs sm:grid-cols-2">
        <div><dt className="text-[var(--color-muted)]">Source type</dt><dd className="mt-1 font-medium text-[var(--color-ink)]">{sourceType}</dd></div>
        <div><dt className="text-[var(--color-muted)]">Source</dt><dd className="mt-1 font-medium text-[var(--color-ink)]">{event.source_name ?? (event.source_type === "community" ? "Community report" : "Not listed")}</dd></div>
        <div><dt className="text-[var(--color-muted)]">Issued</dt><dd className="mt-1 font-medium text-[var(--color-ink)]"><time dateTime={event.issued_at}>{formatDate(event.issued_at)}</time></dd></div>
        {event.expires_at && <div><dt className="text-[var(--color-muted)]">{isSafetyEventExpired(event) ? "Expired" : "Expires"}</dt><dd className="mt-1 font-medium text-[var(--color-ink)]"><time dateTime={event.expires_at}>{formatDate(event.expires_at)}</time></dd></div>}
      </dl>
      {event.location_name && <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-slate)]"><MapPin className="size-4 text-[var(--color-copper-deep)]" />{event.location_name}</p>}
      {event.source_url && <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View original source <ExternalLink className="size-4" /></a>}
      {event.source_type === "community" && <SafetyReportVoting reportId={event.id} />}
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
