import { ExternalLink } from "lucide-react";
import { NewsLanguageView } from "@/components/news/news-language-view";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { detectNewsTextLanguage, resolveNewsLanguageContent } from "@/lib/news/language";
import type { NewsEntry } from "@/types/content";

type NewsCardProps = {
  entry: NewsEntry;
  preload?: boolean;
};

export function NewsCard({ entry, preload = false }: NewsCardProps) {
  const fallbackHeadline = resolveNewsLanguageContent(entry, "en").headline;
  const sourceLanguage = detectNewsTextLanguage(entry.original_title ?? entry.title);
  const sourceLanguageLabel = sourceLanguage === "ur"
    ? "Urdu original"
    : sourceLanguage === "mixed"
      ? "Multilingual original"
      : sourceLanguage === "en"
        ? "English original"
        : "Original language unavailable";

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <MediaFrame src={entry.image_url} alt={`Article image associated with ${fallbackHeadline}`} fallbackTitle={fallbackHeadline} fallbackDetail={entry.category} imageSource={entry.image_source} imageCredit={entry.image_credit} imageLicense={entry.image_license} preload={preload} className="aspect-[16/10] border-b border-[var(--color-line)]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><Badge tone="copper">{entry.category}</Badge><time dateTime={entry.published_at || entry.created_at} className="text-xs text-[var(--color-muted)]">{formatDate(entry.published_at, entry.created_at)}</time></div>
        <NewsLanguageView entry={entry} />
        <div className="mt-auto border-t border-[var(--color-line)] pt-4"><p className="truncate text-xs text-[var(--color-slate)]">Source: {entry.source}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[var(--color-muted)]">{sourceLanguageLabel}</span>{entry.source_url ? <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-[var(--color-copper-deep)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View source <ExternalLink className="size-3" /></a> : <span className="text-xs text-[var(--color-muted)]">Source link unavailable</span>}</div></div>
      </div>
    </Card>
  );
}

function formatDate(publishedAt: string, createdAt: string) {
  const value = publishedAt || createdAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
