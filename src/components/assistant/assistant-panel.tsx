"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, LoaderCircle, Sparkles } from "lucide-react";
import { suggestedPrompts } from "@/data/demo-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AssistantResult, AssistantSource } from "@/lib/assistant/service";
import type { SuggestedPrompt } from "@/types/content";

export function AssistantPanel({ initialValue = "", sectionId, suggestedPrompts: promptOptions = suggestedPrompts }: { initialValue?: string; sectionId?: string; suggestedPrompts?: SuggestedPrompt[] }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = value.trim();
    if (!message || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getApiError(payload));
      if (!isAssistantResult(payload)) throw new Error("The assistant returned an invalid response.");
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not complete the request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id={sectionId} className="mt-12" aria-labelledby="assistant-heading" aria-busy={loading}>
      <Card className="relative overflow-hidden border-[var(--color-line-strong)] p-5 sm:p-7 lg:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(135deg,transparent_0%,rgba(241,237,229,0.7)_100%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3"><Badge tone="green"><Sparkles className="size-3" />Intelligent guide</Badge><span className="text-xs text-[var(--color-muted)]">Grounded in trusted local knowledge</span></div>
          <h2 id="assistant-heading" className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">Ask about a place, a story, or a way in.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-slate)]">Ask a question and CHAYTHRAAR will bring together trusted local knowledge in one clear answer.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="assistant-question">Ask CHAYTHRAAR a question</label><input id="assistant-question" value={value} onChange={(event) => { setValue(event.target.value); setResult(null); setError(null); }} placeholder="What would you like to understand?" className="h-12 min-w-0 flex-1 rounded-full border border-[var(--color-line-strong)] bg-[var(--background)] px-5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" disabled={loading} /><button type="submit" disabled={loading || !value.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-copper)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{loading ? "Thinking" : "Ask CHAYTHRAAR"}{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}</button></form>
          {loading && <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">Searching trusted local knowledge...</p>}
          {error && <p className="mt-3 text-sm text-[var(--color-copper-deep)]" role="alert">{error}</p>}
          {result && <div className="mt-5 border-t border-[var(--color-line)] pt-4" aria-live="polite"><p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">{result.answer}</p>{result.sources.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold text-[var(--color-muted)]">Sources</h3><ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{result.sources.map((source) => <li key={`${source.type}:${source.id}`} className="text-xs">{renderSource(source)}</li>)}</ul></div>}</div>}
          <div className="mt-6 flex flex-wrap gap-2">{promptOptions.map((item) => <button key={item.id} type="button" disabled={loading} onClick={() => { setValue(item.prompt); setResult(null); setError(null); }} className="rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-left text-xs text-[var(--color-slate)] transition-colors hover:border-[var(--color-copper)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] disabled:opacity-60">{item.label}</button>)}</div>
        </div>
      </Card>
    </section>
  );
}

function renderSource(source: AssistantSource) {
  const label = `${source.title}${source.source_name ? ` · ${source.source_name}` : ""}`;
  if (source.source_url && isHttpUrl(source.source_url)) {
    return <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-copper-deep)] underline decoration-[var(--color-line-strong)] underline-offset-2 hover:decoration-[var(--color-copper)]">{label}</a>;
  }
  return <span className="text-[var(--color-slate)]">{label}</span>;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAssistantResult(value: unknown): value is AssistantResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.answer === "string" && Array.isArray(result.sources) && result.sources.every(isAssistantSource);
}

function isAssistantSource(value: unknown): value is AssistantSource {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  const sourceTypes: AssistantSource["type"][] = ["encyclopedia", "news", "safety", "place", "translation", "khowar_lexicon"];
  return typeof source.id === "string"
    && typeof source.type === "string" && sourceTypes.includes(source.type as AssistantSource["type"])
    && typeof source.title === "string"
    && (typeof source.source_name === "string" || source.source_name === null)
    && (typeof source.source_url === "string" || source.source_url === null);
}

function getApiError(value: unknown): string {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
  return "The assistant could not complete the request.";
}
