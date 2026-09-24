"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { suggestedPrompts } from "@/data/demo-content";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AssistantPanel() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim()) setSubmitted(true);
  }

  return (
    <section className="mt-12" aria-labelledby="assistant-heading">
      <Card className="relative overflow-hidden border-[var(--color-line-strong)] p-5 sm:p-7 lg:p-8">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(135deg,transparent_0%,rgba(241,237,229,0.7)_100%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3"><Badge tone="green"><Sparkles className="size-3" />Intelligent guide</Badge><span className="text-xs text-[var(--color-muted)]">UI preview · no live AI connection</span></div>
          <h2 id="assistant-heading" className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">Ask about a place, a story, or a way in.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-slate)]">Start with a question and CHAYTHRAAR will eventually bring together trusted local knowledge in one clear answer.</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="assistant-question">Ask CHAYTHRAAR a question</label><input id="assistant-question" value={value} onChange={(event) => { setValue(event.target.value); setSubmitted(false); }} placeholder="What would you like to understand?" className="h-12 min-w-0 flex-1 rounded-full border border-[var(--color-line-strong)] bg-[var(--background)] px-5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-copper-soft)]" /><button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-copper)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2">Ask demo guide<ArrowUp className="size-4" /></button></form>
          {submitted && <p className="mt-3 text-sm text-[var(--color-green-deep)]" role="status">Thanks. This demo input is ready for the future assistant connection.</p>}
          <div className="mt-6 flex flex-wrap gap-2">{suggestedPrompts.map((item) => <button key={item.id} type="button" onClick={() => { setValue(item.prompt); setSubmitted(false); }} className="rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-left text-xs text-[var(--color-slate)] transition-colors hover:border-[var(--color-copper)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">{item.label}</button>)}</div>
        </div>
      </Card>
    </section>
  );
}
