import { BookOpen } from "lucide-react";
import { EncyclopediaBrowser } from "@/components/encyclopedia/encyclopedia-browser";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { encyclopediaTopics } from "@/data/demo-content";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";
import type { EncyclopediaEntry, EncyclopediaTopic } from "@/types/content";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const entries = await getEncyclopediaEntries();
  const topics = entries.length > 0 ? entries : encyclopediaTopics.map(toEntry);
  const isLive = entries.length > 0;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl">
            <Badge tone="copper">Explore · Encyclopedia</Badge>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">Understand the place before you move through it.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-slate)] sm:text-lg">A grounded collection of clear, contextual stories about Chitral, its people, language, and landscapes.</p>
          </div>
          <Card className="relative min-h-72 overflow-hidden bg-[var(--color-sand)] p-7 sm:min-h-96 sm:p-9"><div className="absolute -right-16 -top-16 size-52 rounded-full border border-[var(--color-copper)]/15" /><div className="absolute -bottom-24 -left-8 size-72 rounded-full border border-[var(--color-copper)]/15" /><div className="relative flex min-h-56 flex-col justify-between"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[var(--color-copper)] shadow-sm"><BookOpen className="size-6" /></span><Badge tone={isLive ? "green" : "neutral"}>{isLive ? "Live content" : "Demo content"}</Badge></div><div><p className="max-w-sm text-2xl font-semibold leading-8 tracking-[-0.03em] text-[var(--color-ink)]">A living index for learning the shape of a place.</p><p className="mt-4 text-sm text-[var(--color-slate)]">{isLive ? "Loaded from the CHAYTHRAAR encyclopedia." : "Using local demo topics while the encyclopedia is being populated."}</p></div></div></Card>
        </section>

        <section className="mt-16" aria-labelledby="encyclopedia-heading">
          <EncyclopediaBrowser entries={topics} />
        </section>
      </main>
    </AppShell>
  );
}

function toEntry(topic: EncyclopediaTopic): EncyclopediaEntry {
  return {
    id: topic.id,
    title: topic.title,
    category: topic.category,
    content: topic.summary,
    image_url: null,
    source: "CHAYTHRAAR demo data",
    source_url: null,
    created_at: new Date(0).toISOString(),
  };
}
