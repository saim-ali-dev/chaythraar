"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { NewsEntry } from "@/types/content";

type NewsBrowserProps = {
  entries: NewsEntry[];
};

export function NewsBrowser({ entries }: NewsBrowserProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const categories = useMemo(() => Array.from(new Set(entries.map((entry) => entry.category))).sort(), [entries]);
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory = category === "All categories" || entry.category === category;
      const searchableText = `${entry.title} ${entry.category} ${entry.summary ?? ""} ${entry.source}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, entries, query]);

  return (
    <section className="mt-10" aria-labelledby="news-list-heading">
      <div className="flex flex-col gap-5 border-b border-[var(--color-line-strong)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Latest updates</p>
          <h2 id="news-list-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">News from the network</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]" aria-live="polite">{entries.length === 0 ? "No news records available" : `${filteredEntries.length} of ${entries.length} updates`}</p>
        </div>
        {entries.length > 0 && <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <label className="relative min-w-0 flex-1 sm:min-w-72"><span className="sr-only">Search news</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search updates" className="min-h-11 w-full rounded-md border border-[var(--color-line-strong)] bg-white pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" /></label>
          <label className="relative"><span className="sr-only">Filter news by category</span><Filter className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full appearance-none rounded-md border border-[var(--color-line-strong)] bg-white pl-11 pr-9 text-sm text-[var(--color-ink)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)] sm:w-56"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>}
      </div>
      {entries.length === 0 ? <EmptyNewsState /> : filteredEntries.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredEntries.map((entry) => <NewsCard key={entry.id} entry={entry} />)}</div> : <Card className="mt-6 p-6"><Badge tone="copper">No matching updates</Badge><h3 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Try a broader search.</h3><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">No current news records match those words and category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All categories"); }} className="mt-4 min-h-10 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Clear filters</button></Card>}
    </section>
  );
}

function EmptyNewsState() {
  return <section className="mt-5 border-y border-[var(--color-line)] py-6" role="status"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">News records</p><h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">No news records are available to display.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">No placeholder stories are shown in this view.</p></section>;
}