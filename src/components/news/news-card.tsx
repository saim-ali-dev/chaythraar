import { ExternalLink } from "lucide-react";
import { NewsLanguageView } from "@/components/news/news-language-view";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import type { NewsEntry } from "@/types/content";

type NewsCardProps = {
  entry: NewsEntry;
};

export function NewsCard({ entry }: NewsCardProps) {
  const headline = entry.headline ?? entry.title;
  const summary = entry.summary_short ?? "CHAYTHRAAR summary pending.";

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <MediaFrame src={entry.image_url} alt={entry.image_url ? headline : ""} fallbackTitle={headline} fallbackDetail={entry.category} className="aspect-[16/10] border-b border-[var(--color-line)]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><Badge tone="copper">{entry.category}</Badge><time dateTime={entry.published_at || entry.created_at} className="text-xs text-[var(--color-muted)]">{formatDate(entry.published_at, entry.created_at)}</time></div>
        {entry.original_language === "ur" ? <NewsLanguageView headline={headline} summary={summary} originalTitle={entry.original_title ?? entry.title} originalSummary={entry.summary} /> : <div className="mt-4"><h2 className="text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]">{headline}</h2><p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-slate)]">{summary}</p></div>}
        <div className="mt-auto border-t border-[var(--color-line)] pt-4"><p className="truncate text-xs text-[var(--color-slate)]">Source: {entry.source}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[var(--color-muted)]">{entry.original_language === "ur" ? "Urdu original" : "English"}</span>{entry.source_url ? <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-[var(--color-copper-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View source <ExternalLink className="size-3" /></a> : <span className="text-xs text-[var(--color-muted)]">Source link unavailable</span>}</div></div>
      </div>
    </Card>
  );
}

function formatDate(publishedAt: string, createdAt: string) {
  const value = publishedAt || createdAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
