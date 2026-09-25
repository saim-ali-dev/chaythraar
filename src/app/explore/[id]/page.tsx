import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { encyclopediaTopics } from "@/data/demo-content";
import { getEncyclopediaEntryById } from "@/lib/supabase/encyclopedia";
import type { EncyclopediaEntry } from "@/types/content";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEncyclopediaEntryById(id);
  return entry ? { title: entry.title, description: entry.content.slice(0, 160) } : { title: "Encyclopedia article" };
}

export default async function EncyclopediaArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const liveEntry = await getEncyclopediaEntryById(id);
  const entry = liveEntry ?? findDemoEntry(id);

  if (!entry) notFound();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><ArrowLeft className="size-4" />Back to Encyclopedia</Link>
        <article className="mt-8">
          <header className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr]">
            <div><Badge tone="copper">{entry.category} · Encyclopedia</Badge><h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">{entry.title}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-slate)]">A sourced CHAYTHRAAR knowledge entry, presented with context and room for the original source.</p></div>
            <Card className="relative flex min-h-56 items-center justify-center overflow-hidden bg-[var(--color-ink)] p-8 text-white sm:min-h-64"><div className="absolute -right-12 -top-14 size-48 rounded-full border border-white/10" /><div className="absolute -bottom-16 -left-8 size-52 rounded-full border border-[var(--color-copper)]/30" /><BookOpen className="relative size-12 text-[var(--color-copper-soft)]" /></Card>
          </header>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.34fr]">
            <Card className="p-6 sm:p-8"><div className="prose max-w-none"><p className="whitespace-pre-line text-base leading-8 text-[var(--color-ink)]">{entry.content}</p></div><div className="mt-8 border-t border-[var(--color-line)] pt-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">Source</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{entry.source ?? "Source not listed"}</p>{entry.source_url ? <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View original source <ExternalLink className="size-4" /></a> : <p className="mt-3 text-sm text-[var(--color-muted)]">No source URL is available for this entry.</p>}</div></Card>
            <Card className="h-fit bg-[var(--color-sand)] p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-copper)]">Article details</p><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-[var(--color-muted)]">Category</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">{entry.category}</dd></div><div><dt className="text-[var(--color-muted)]">Added</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">{formatDate(entry.created_at)}</dd></div></dl><a href="#article-assistant" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-slate)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2"><Sparkles className="size-4" />Ask CHAYTHRAAR</a></Card>
          </div>
        </article>
        <AssistantPanel sectionId="article-assistant" initialValue={`Tell me more about: ${entry.title}`} />
      </main>
    </AppShell>
  );
}

function findDemoEntry(id: string): EncyclopediaEntry | null {
  const topic = encyclopediaTopics.find((item) => item.id === id);
  return topic ? { id: topic.id, title: topic.title, category: topic.category, content: topic.summary, image_url: null, source: "CHAYTHRAAR demo data", source_url: null, created_at: new Date(0).toISOString() } : null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.getTime() === 0 ? "Demo entry" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
