import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import type { EncyclopediaEntry } from "@/types/content";

type EncyclopediaCardProps = {
  entry: EncyclopediaEntry;
};

export function EncyclopediaCard({ entry }: EncyclopediaCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <MediaFrame src={entry.image_url} alt={entry.title} fallbackTitle={entry.title} fallbackDetail={entry.category} className="aspect-[16/10] border-b border-[var(--color-line)]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="copper">{entry.category}</Badge>
          <time dateTime={entry.created_at} className="text-xs text-[var(--color-muted)]">{formatDate(entry.created_at)}</time>
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-[var(--color-ink)]">{entry.title}</h3>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-slate)]">{summarize(entry.content)}</p>
        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-muted)]">
            <span className="min-w-0 truncate">Source: {entry.source ?? "Not listed"}</span>
            {entry.source_url ? <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-slate)]"><ExternalLink className="size-3" />Linked source</span> : <span className="text-xs text-[var(--color-muted)]">Source link unavailable</span>}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link href={`/explore/${entry.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Read article <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
            {entry.source_url && <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-slate)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View source <ExternalLink className="size-3" /></a>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function summarize(content: string) {
  return content.length > 180 ? `${content.slice(0, 177).trimEnd()}...` : content;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
