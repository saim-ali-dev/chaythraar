import { ExternalLink, Languages } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { SuggestedPrompt } from "@/types/content";

const khowarPrompts: SuggestedPrompt[] = [
  { id: "language-writing", label: "Language & writing", prompt: "Help me understand Khowar language and writing." },
  { id: "words-lexicon", label: "Words & lexicon", prompt: "Help me explore Khowar words and the available lexicon." },
  { id: "grammar", label: "Grammar", prompt: "What can CHAYTHRAAR explain about Khowar grammar from its available sources?" },
  { id: "urdu-english", label: "Urdu / English help", prompt: "Can you help me explore Khowar with Urdu or English context from available sources?" },
];

export default function KhowarPage() {
  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          variant="editorial"
          eyebrow="Language · Khowar"
          title="Explore Khowar"
          description="Ask about words, writing, or language context. Review any sources shown with an answer; a prompt is not a guarantee that a translation is available."
        />

        <AssistantPanel sectionId="khowar-assistant" initialValue="Tell me about Khowar language and writing." suggestedPrompts={khowarPrompts} />

        <section className="mt-12 border-t border-[var(--color-line-strong)] pt-6" aria-labelledby="khowar-sources-heading">
          <div className="flex items-start gap-3"><Languages className="mt-1 size-5 shrink-0 text-[var(--color-copper-deep)]" /><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Sources &amp; attribution</p><h2 id="khowar-sources-heading" className="mt-2 text-lg font-semibold text-[var(--color-ink)]">FLI Khowar Word List</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">The Khowar lexical data includes the Forum for Language Initiatives (FLI) word list, retained with its attribution and CC-BY-NC-4.0 license metadata.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">This word list is lexical and script data. It is not a complete translation dictionary, so its entries should not be presented as definitions or translations.</p><a href="https://mozilladatacollective.com/datasets/cmlgxqdl80019mg07p0197u76" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View dataset record <ExternalLink className="size-4" /></a></div></div>
        </section>
      </main>
    </AppShell>
  );
}
