"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";
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

  const sourceGroups = result?.sources.reduce((groups, source) => {
    const group = groups.get(source.type) ?? [];
    group.push(source);
    groups.set(source.type, group);
    return groups;
  }, new Map<AssistantSource["type"], AssistantSource[]>()) ?? new Map<AssistantSource["type"], AssistantSource[]>();

  return (
    <section id={sectionId} className="mt-12" aria-labelledby="assistant-heading" aria-busy={loading}>
      <Card className="border-[var(--color-line-strong)] p-5 sm:p-7 lg:p-8">
        <div>
          <Badge tone="copper">Ask CHAYTHRAAR</Badge>
          <h2 id="assistant-heading" className="font-editorial mt-4 max-w-xl text-2xl leading-tight text-[var(--color-ink)] sm:text-3xl">Ask about a place, a story, language, or local knowledge.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">Answers may include source links when available. Check the source details alongside the response.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="assistant-question">Ask CHAYTHRAAR a question</label><input id="assistant-question" value={value} onChange={(event) => { setValue(event.target.value); setResult(null); setError(null); }} placeholder="What would you like to understand?" className="min-h-12 min-w-0 flex-1 rounded-md border border-[var(--color-line-strong)] bg-white px-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" disabled={loading} /><button type="submit" disabled={loading || !value.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--color-copper-deep)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{loading ? "Working" : "Ask"}{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ArrowUp className="size-4" aria-hidden="true" />}</button></form>
          {loading && <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">Working on your question...</p>}
          {error && <p className="mt-3 text-sm text-[var(--color-copper-deep)]" role="alert">{error}</p>}
          {result && <div className="mt-6 border-t border-[var(--color-line-strong)] pt-5" aria-live="polite"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Answer</h3><p className="mt-3 max-w-prose whitespace-pre-wrap text-base leading-7 text-[var(--color-ink)]">{result.answer}</p>{result.sources.length > 0 && <div className="mt-6 border-t border-[var(--color-line)] pt-4"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Sources</h3>{Array.from(sourceGroups.entries()).map(([type, sources]) => <section key={type} className="mt-4"><h4 className="text-xs font-semibold capitalize text-[var(--color-slate)]">{sourceTypeLabel(type)}</h4><ul className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">{sources.map((source) => <li key={`${source.type}:${source.id}`} className="min-w-0 border-l-2 border-[var(--color-line-strong)] py-1 pl-3 text-sm">{renderSource(source)}</li>)}</ul></section>)}</div>}</div>}
          <div className="mt-6 flex flex-wrap gap-2">{promptOptions.map((item) => <button key={item.id} type="button" disabled={loading} onClick={() => { setValue(item.prompt); setResult(null); setError(null); }} className="min-h-11 rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-left text-xs text-[var(--color-slate)] transition-colors hover:border-[var(--color-copper)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] disabled:opacity-60">{item.label}</button>)}</div>
        </div>
      </Card>
    </section>
  );
}

function renderSource(source: AssistantSource) {
  const label = source.type === "khowar_glossary"
    ? `Khowar glossary · ${source.title}${source.source_locator ? ` · ${source.source_locator}` : ""}${source.source_name ? ` · ${source.source_name}` : ""}`
    : `${source.title}${source.source_name ? ` · ${source.source_name}` : ""}`;
  if (source.source_url && isHttpUrl(source.source_url)) {
    return <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="break-words text-[var(--color-copper-deep)] underline decoration-[var(--color-line-strong)] underline-offset-2 hover:decoration-[var(--color-copper)]">{label}</a>;
  }
  return <span className="break-words text-[var(--color-slate)]">{label}</span>;
}

function sourceTypeLabel(type: AssistantSource["type"]) {
  const labels: Record<AssistantSource["type"], string> = {
    encyclopedia: "Encyclopedia",
    news: "News",
    safety: "Safety",
    place: "Places",
    translation: "Translation",
    khowar_lexicon: "Khowar lexicon",
    khowar_glossary: "Khowar glossary",
  };
  return labels[type];
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
  const sourceTypes: AssistantSource["type"][] = ["encyclopedia", "news", "safety", "place", "translation", "khowar_lexicon", "khowar_glossary"];
  return typeof source.id === "string"
    && typeof source.type === "string" && sourceTypes.includes(source.type as AssistantSource["type"])
    && typeof source.title === "string"
    && (typeof source.source_name === "string" || source.source_name === null)
    && (typeof source.source_url === "string" || source.source_url === null)
    && (source.source_locator === undefined || typeof source.source_locator === "string" || source.source_locator === null)
    && (source.source_doi === undefined || typeof source.source_doi === "string" || source.source_doi === null);
}

function getApiError(value: unknown): string {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") return value.error;
  return "The assistant could not complete the request.";
}
