import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { NewsEntry } from "@/types/content";

type NewsCardProps = {
  entry: NewsEntry;
};

export function NewsCard({ entry }: NewsCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[var(--color-ink)] text-white" aria-hidden="true">
        <div className="absolute -right-10 -top-16 size-44 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-5 size-48 rounded-full border border-[var(--color-copper)]/30" />
        <Newspaper className="relative size-8 text-[var(--color-copper-soft)] transition-transform group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><Badge tone="copper">{entry.category}</Badge><time dateTime={entry.published_at} className="text-xs text-[var(--color-muted)]">{formatDate(entry.published_at, entry.created_at)}</time></div>
        <h2 className="mt-4 text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]">{entry.title}</h2>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-slate)]">{entry.summary ?? "No summary is available for this update."}</p>
        <div className="mt-auto border-t border-[var(--color-line)] pt-4"><p className="truncate text-xs text-[var(--color-muted)]">Source: {entry.source}</p><div className="mt-4 flex items-center justify-end gap-3">{entry.source_url ? <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-slate)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View source <ExternalLink className="size-3" /></a> : <Badge>Source URL pending</Badge>}</div></div>
      </div>
    </Card>
  );
}

function formatDate(publishedAt: string, createdAt: string) {
  const value = publishedAt || createdAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
