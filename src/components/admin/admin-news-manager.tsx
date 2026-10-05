"use client";

import { useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";

type NewsRecord = { id: string; title: string; headline: string | null; summary: string | null; summary_short: string | null; source: string; source_url: string | null; published_at: string; category: string };
type NewsReport = { fetched: number; normalized: number; recent: number; inserted: number; updatedRows: number; unchanged: number; failed: number; errors: string[] };
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--color-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mist)] disabled:cursor-not-allowed disabled:opacity-50";

export function AdminNewsManager() {
  const [records, setRecords] = useState<NewsRecord[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<NewsReport | null>(null);

  async function loadRecords() {
    const response = await fetch("/api/admin/news", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load news records.");
    setRecords(body.records as NewsRecord[]);
    setCount(Number(body.count) || 0);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/news", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load news records.");
        return body;
      })
      .then((body) => {
        if (!active) return;
        setRecords(body.records as NewsRecord[]);
        setCount(Number(body.count) || 0);
      })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load news records."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function refreshNews() {
    setRefreshing(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/admin/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "refresh" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The news refresh could not complete.");
      setReport(body.report as NewsReport);
      await loadRecords();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "The news refresh could not complete.");
    } finally {
      setRefreshing(false);
    }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3"><p className="text-sm text-[var(--color-slate)]">{count} stored items · latest {records.length} shown</p><button className={buttonClass} type="button" onClick={() => void refreshNews()} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />{refreshing ? "Refreshing sources" : "Refresh feeds"}</button></div>
    {refreshing && <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]" role="status"><LoaderCircle className="size-4 animate-spin" />Fetching feeds, checking recent items, and generating summaries where configured.</p>}
    {error && <p className="border-l-2 border-[var(--color-danger-deep)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
    {report && <div className="border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] px-4 py-3 text-sm" role="status"><p className="font-semibold text-[var(--color-ink)]">Refresh finished</p><p className="mt-1 text-[var(--color-slate)]">Fetched {report.fetched}; inserted {report.inserted}; updated {report.updatedRows}; unchanged {report.unchanged}; failed {report.failed}.</p>{report.errors.length > 0 && <ul className="mt-2 list-inside list-disc text-xs text-[var(--color-danger-deep)]">{report.errors.map((item) => <li key={item}>{item}</li>)}</ul>}</div>}
    {loading ? <p className="py-8 text-sm text-[var(--color-muted)]">Loading news records</p> : <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">{records.map((record) => <article key={record.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-[var(--color-ink)]">{record.headline || record.title}</h2><span className="text-xs text-[var(--color-muted)]">{record.category}</span></div><p className="mt-1 text-sm leading-6 text-[var(--color-slate)]">{record.summary_short || record.summary || "No summary available."}</p><p className="mt-2 text-xs text-[var(--color-muted)]">{record.source} · {formatDate(record.published_at)}</p></div>{record.source_url && <a className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-copper-deep)]" href={record.source_url} target="_blank" rel="noopener noreferrer">Open source <ExternalLink className="size-3.5" aria-hidden="true" /></a>}</article>)}{records.length === 0 && <p className="py-6 text-sm text-[var(--color-muted)]">No news records are stored.</p>}</div>}
  </section>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}