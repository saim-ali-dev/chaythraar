"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { EncyclopediaCard } from "@/components/encyclopedia/encyclopedia-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EncyclopediaEntry } from "@/types/content";

type EncyclopediaBrowserProps = {
  entries: EncyclopediaEntry[];
  heading?: string;
  singularItemLabel?: string;
  pluralItemLabel?: string;
  showCategoryFilter?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function EncyclopediaBrowser({
  entries,
  heading = "Start learning",
  singularItemLabel = "article",
  pluralItemLabel = "articles",
  showCategoryFilter = true,
  emptyTitle = "No encyclopedia entries are available to browse.",
  emptyDescription = "The archive will show entries here when records are available.",
}: EncyclopediaBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = useMemo(() => Array.from(new Set(entries.map((entry) => entry.category))).sort(), [entries]);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory = category === "All categories" || entry.category === category;
      const searchableText = `${entry.title} ${entry.category} ${entry.content}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, entries, query]);

  return (
    <section className="mt-10" aria-labelledby="encyclopedia-heading">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-copper)]">Knowledge base</p><h2 id="encyclopedia-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">{heading}</h2><p className="mt-2 text-sm text-[var(--color-muted)]">{filteredEntries.length} of {entries.length} {entries.length === 1 ? singularItemLabel : pluralItemLabel}</p></div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <label className="relative min-w-0 flex-1 sm:min-w-72"><span className="sr-only">Search encyclopedia</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, category, or content" className="h-11 w-full rounded-full border border-[var(--color-line-strong)] bg-white pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" /></label>
          {showCategoryFilter && <label className="relative"><span className="sr-only">Filter by category</span><Filter className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full appearance-none rounded-full border border-[var(--color-line-strong)] bg-white pl-11 pr-9 text-sm text-[var(--color-ink)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)] sm:w-56"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>}
        </div>
      </div>
      {entries.length === 0 ? <Card className="mt-6 border-t-2 border-t-[var(--color-copper)] bg-[var(--color-sand)] p-6"><h3 className="text-lg font-semibold text-[var(--color-ink)]">{emptyTitle}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">{emptyDescription}</p></Card> : filteredEntries.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredEntries.map((entry) => <EncyclopediaCard key={entry.id} entry={entry} />)}</div> : <Card className="mt-6 flex min-h-48 flex-col items-start justify-center p-6"><Badge tone="copper">No matching {pluralItemLabel}</Badge><h3 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Try a broader search.</h3><p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-slate)]">Nothing in the loaded archive matches that combination of words and category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All categories"); }} className="mt-4 min-h-10 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Clear filters</button></Card>}
    </section>
  );
}
