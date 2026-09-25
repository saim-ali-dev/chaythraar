"use client";

import { useMemo, useState } from "react";
import { Filter, Newspaper, Search } from "lucide-react";
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

  return <section className="mt-16" aria-labelledby="news-list-heading"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-copper)]">Latest updates</p><h2 id="news-list-heading" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">News from the network</h2><p className="mt-2 text-sm text-[var(--color-muted)]">{entries.length === 0 ? "No connected sources yet" : `${filteredEntries.length} of ${entries.length} updates`}</p></div>{entries.length > 0 && <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"><label className="relative min-w-0 flex-1 sm:min-w-72"><span className="sr-only">Search news</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search updates" className="h-11 w-full rounded-full border border-[var(--color-line-strong)] bg-white pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" /></label><label className="relative"><span className="sr-only">Filter news by category</span><Filter className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full appearance-none rounded-full border border-[var(--color-line-strong)] bg-white pl-11 pr-9 text-sm text-[var(--color-ink)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)] sm:w-56"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>}</div>{entries.length === 0 ? <EmptyNewsState /> : filteredEntries.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredEntries.map((entry) => <NewsCard key={entry.id} entry={entry} />)}</div> : <Card className="mt-6 flex min-h-56 flex-col items-center justify-center p-8 text-center"><Badge tone="copper">No matching updates</Badge><h3 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Try a broader search.</h3><p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-slate)]">Nothing in the connected news records matches those filters.</p><button type="button" onClick={() => { setQuery(""); setCategory("All categories"); }} className="mt-5 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Clear filters</button></Card>}</section>;
}

function EmptyNewsState() {
  return <Card className="mt-6 overflow-hidden bg-[var(--color-sand)] p-7 sm:p-10"><div className="grid items-center gap-8 lg:grid-cols-[auto_1fr]"><div className="relative flex size-20 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-[var(--color-copper-soft)]"><div className="absolute -right-3 -top-3 size-12 rounded-full border border-[var(--color-copper)]/30" /><Newspaper className="relative size-8" /></div><div><Badge tone="copper">Awaiting connection</Badge><h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">News sources have not been connected yet.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">This space is ready for verified local reporting. No placeholder stories are shown while the news table is empty.</p></div></div></Card>;
}
