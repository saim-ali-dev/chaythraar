import { BookOpen, ExternalLink, Languages } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SuggestedPrompt } from "@/types/content";

const khowarPrompts: SuggestedPrompt[] = [
  { id: "language-writing", label: "Language & writing", prompt: "Help me understand Khowar language and writing." },
  { id: "words-lexicon", label: "Words & lexicon", prompt: "Help me explore Khowar words and the available lexicon." },
  { id: "grammar", label: "Grammar", prompt: "What can CHAYTHRAAR explain about Khowar grammar from its available sources?" },
  { id: "urdu-english", label: "Urdu / English help", prompt: "Can you help me explore Khowar with Urdu or English context from verified sources?" },
];

export default function KhowarPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl">
            <Badge tone="copper"><Languages className="mr-1 size-3" />Khowar · Language guide</Badge>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">Make room for a living language.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-slate)] sm:text-lg">CHAYTHRAAR helps preserve and explore Khowar through grounded questions, careful context, and sources that remain visible.</p>
          </div>
          <Card className="relative min-h-72 overflow-hidden bg-[var(--color-sand)] p-7 sm:min-h-96 sm:p-9">
            <div className="absolute -right-16 -top-16 size-52 rounded-full border border-[var(--color-copper)]/15" />
            <div className="absolute -bottom-24 -left-8 size-72 rounded-full border border-[var(--color-copper)]/15" />
            <div className="relative flex min-h-56 flex-col justify-between">
              <div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[var(--color-copper)] shadow-sm"><BookOpen className="size-6" /></span><Badge tone="green">Source-aware</Badge></div>
              <p className="max-w-sm text-2xl font-semibold leading-8 tracking-[-0.03em] text-[var(--color-ink)]">Ask carefully. Keep the context close.</p>
            </div>
          </Card>
        </section>

        <AssistantPanel sectionId="khowar-assistant" initialValue="Tell me about Khowar language and writing." suggestedPrompts={khowarPrompts} />

        <section className="mt-12" aria-labelledby="khowar-sources-heading">
          <Card className="bg-[var(--color-sand)] p-6 sm:p-8">
            <div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--color-copper)]"><Languages className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-copper)]">Sources &amp; attribution</p><h2 id="khowar-sources-heading" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">FLI Khowar Word List</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">The Khowar lexical data includes the Forum for Language Initiatives (FLI) word list, retained with its attribution and CC-BY-NC-4.0 license metadata.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">This word list is lexical and script data. It is not a complete translation dictionary, so CHAYTHRAAR should not present its entries as definitions or translations.</p><a href="https://mozilladatacollective.com/datasets/cmlgxqdl80019mg07p0197u76" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View dataset record <ExternalLink className="size-4" /></a></div></div>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}
