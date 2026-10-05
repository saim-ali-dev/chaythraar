"use client";

import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";

type LexiconEntry = { id: string; entry: string; record_type: string; source_name: string; source_url: string; license: string; attribution: string };
type GlossaryEntry = { id: string; headword: string; english_gloss: string | null; english_definition: string | null; cultural_notes: string | null; source_author: string; source_title: string; publication_year: number; source_url: string; source_doi: string; source_locator: string | null; license: string; attribution: string };

export function AdminKhowarDictionary() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"lexicon" | "glossary">("glossary");
  const [entries, setEntries] = useState<LexiconEntry[]>([]);
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/khowar/lexicon?kind=${kind}&q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not search the lexicon.");
      if (kind === "lexicon") setEntries(body.entries as LexiconEntry[]);
      else setGlossaryEntries(body.entries as GlossaryEntry[]);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Could not search the lexicon.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="mt-4">
    <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row"><label className="block text-xs font-semibold text-[var(--color-slate)]">Data set<select className="mt-1 min-h-11 w-full border border-[var(--color-line-strong)] bg-white px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value as "lexicon" | "glossary")}><option value="glossary">Sourced glossary</option><option value="lexicon">Imported word list</option></select></label><label className="min-w-0 flex-1"><span className="sr-only">Search imported Khowar entries</span><input className="mt-5 min-h-11 w-full border border-[var(--color-line-strong)] bg-white px-3 text-sm sm:mt-0" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter at least two characters" minLength={2} maxLength={120} /></label><button className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--color-ink)] px-4 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={loading || query.trim().length < 2}><Search className="size-4" aria-hidden="true" />{loading ? "Searching" : "Search"}</button></form>
    {error && <p className="mt-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
    {kind === "lexicon" && entries.length > 0 && <ul className="mt-4 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">{entries.map((entry) => <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words font-medium text-[var(--color-ink)]">{entry.entry}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{entry.record_type} · {entry.license}</p><p className="mt-1 text-xs text-[var(--color-slate)]">{entry.attribution}</p></div><a className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-copper-deep)]" href={entry.source_url} target="_blank" rel="noopener noreferrer">Source <ExternalLink className="size-3.5" aria-hidden="true" /></a></li>)}</ul>}
    {kind === "glossary" && glossaryEntries.length > 0 && <ul className="mt-4 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">{glossaryEntries.map((entry) => <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words font-medium text-[var(--color-ink)]">{entry.headword}{entry.english_gloss ? ` · ${entry.english_gloss}` : ""}</p>{entry.english_definition && <p className="mt-1 text-sm leading-6 text-[var(--color-slate)]">{entry.english_definition}</p>}{entry.cultural_notes && <p className="mt-1 text-sm leading-6 text-[var(--color-slate)]">{entry.cultural_notes}</p>}<p className="mt-1 text-xs text-[var(--color-muted)]">{entry.source_author} · {entry.source_title} ({entry.publication_year}) · {entry.license}</p><p className="mt-1 text-xs text-[var(--color-slate)]">{entry.attribution}{entry.source_locator ? ` · ${entry.source_locator}` : ""}</p></div><a className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-copper-deep)]" href={entry.source_url} target="_blank" rel="noopener noreferrer">Source <ExternalLink className="size-3.5" aria-hidden="true" /></a></li>)}</ul>}
    {!loading && query.trim().length >= 2 && (kind === "lexicon" ? entries.length : glossaryEntries.length) === 0 && !error && <p className="mt-4 text-sm text-[var(--color-muted)]">No matching entries in the first 50 results.</p>}
  </div>;
}