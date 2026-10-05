"use client";

import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";

const sourceTypes = [
  ["encyclopedia", "Encyclopedia"],
  ["place", "Places"],
  ["news", "News"],
  ["safety", "Safety"],
  ["translation", "Translations"],
  ["khowar_lexicon", "Khowar lexicon"],
  ["khowar_glossary", "Khowar glossary"],
] as const;

export function AdminKnowledgeOps() {
  const [sourceType, setSourceType] = useState<string>(sourceTypes[0][0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  async function reindex() {
    if (!window.confirm(`Rebuild the ${sourceTypes.find(([value]) => value === sourceType)?.[1]} knowledge index? This may make paid embedding requests.`)) return;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const response = await fetch("/api/admin/knowledge/reindex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error([body.error, body.output].filter(Boolean).join("\n"));
      setOutput(body.output || "Index rebuild completed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The indexer could not complete.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="border-t border-[var(--color-line)] pt-5" aria-labelledby="reindex-heading">
    <h2 id="reindex-heading" className="text-lg font-semibold text-[var(--color-ink)]">Indexing</h2>
    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">Rebuild one source index at a time. Embeddings may incur provider usage; large source groups can take several minutes.</p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="block min-w-56 text-sm font-semibold text-[var(--color-ink)]">Source type
        <select className="mt-1 min-h-10 w-full border border-[var(--color-line-strong)] bg-white px-3 text-sm" value={sourceType} onChange={(event) => setSourceType(event.target.value)} disabled={busy}>
          {sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button className="inline-flex min-h-10 items-center justify-center gap-2 bg-[var(--color-ink)] px-4 text-sm font-semibold text-white disabled:opacity-50" type="button" onClick={() => void reindex()} disabled={busy}>
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
        {busy ? "Rebuilding index" : "Rebuild selected index"}
      </button>
    </div>
    {busy && <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">Indexing may take several minutes. Keep this page open.</p>}
    {error && <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap border-l-2 border-[var(--color-danger-deep)] bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-danger-deep)]" role="alert">{error}</pre>}
    {output && <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] p-3 text-xs text-[var(--color-slate)]" role="status">{output}</pre>}
  </section>;
}