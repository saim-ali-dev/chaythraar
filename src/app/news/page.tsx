import { Newspaper } from "lucide-react";
import { NewsBrowser } from "@/components/news/news-browser";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getNewsEntries } from "@/lib/supabase/news";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const entries = await getNewsEntries();
  const hasNews = entries.length > 0;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl"><Badge tone="copper">News · Live feed</Badge><h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">Keep a clear view of what is changing.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-slate)] sm:text-lg">A calm, readable stream for verified local updates, with source context and room for nuance.</p></div>
          <Card className="relative min-h-72 overflow-hidden bg-[var(--color-sand)] p-7 sm:min-h-96 sm:p-9"><div className="absolute -right-16 -top-16 size-52 rounded-full border border-[var(--color-copper)]/15" /><div className="absolute -bottom-24 -left-8 size-72 rounded-full border border-[var(--color-copper)]/15" /><div className="relative flex min-h-56 flex-col justify-between"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[var(--color-copper)] shadow-sm"><Newspaper className="size-6" /></span><Badge tone={hasNews ? "green" : "neutral"}>{hasNews ? "Live records" : "Awaiting records"}</Badge></div><div><p className="max-w-sm text-2xl font-semibold leading-8 tracking-[-0.03em] text-[var(--color-ink)]">A reliable pulse for local information.</p><p className="mt-4 text-sm text-[var(--color-slate)]">{hasNews ? "Loaded from the CHAYTHRAAR news table." : "News sources have not been connected yet."}</p></div></div></Card>
        </section>
        <NewsBrowser entries={entries} />
      </main>
    </AppShell>
  );
}
