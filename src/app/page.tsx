import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Languages, Map, Music, Newspaper, ShieldAlert, UtensilsCrossed } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { MediaFrame } from "@/components/ui/media-frame";
import { EncyclopediaCard } from "@/components/encyclopedia/encyclopedia-card";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getEncyclopediaEntries();
  const featuredEntry = entries[0];

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <section className="grid items-center gap-10 border-b border-[var(--color-line-strong)] pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-14">
          <div className="max-w-3xl">
            <Badge tone="copper">Digital cultural archive · Chitral</Badge>
            <h1 className="font-editorial mt-5 max-w-3xl text-4xl leading-[1.08] text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
              A living archive of Chitral.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              Explore Chitral&apos;s culture, history, heritage, language, stories, music, food traditions, and local knowledge.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 border-b border-[var(--color-copper)] pb-1 text-sm font-semibold text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
                Browse the archive <ArrowUpRight className="size-4" />
              </Link>
              <Link href="#ask-chaythraar" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-slate)] hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
                Ask CHAYTHRAAR
              </Link>
            </div>
          </div>
          <Link href={featuredEntry ? `/explore/${featuredEntry.id}` : "/explore"} className="group block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
            <MediaFrame
              src={featuredEntry?.image_url ?? null}
              alt={featuredEntry?.title ?? ""}
              fallbackTitle={featuredEntry?.title ?? "Explore knowledge from Chitral"}
              fallbackDetail={featuredEntry?.category ?? "Culture · history · language · place"}
              className="aspect-[4/3] border border-[var(--color-line)] sm:aspect-[16/10]"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            {featuredEntry && <div className="mt-3 flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-3">
              <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-copper-deep)]">{featuredEntry.title}</span>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">From the archive</span>
            </div>}
          </Link>
        </section>

        <section className="mt-10" aria-labelledby="archive-preview-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">Recently added</p>
              <h2 id="archive-preview-heading" className="font-editorial mt-2 text-2xl leading-tight text-[var(--color-ink)] sm:text-3xl">From the archive</h2>
            </div>
            <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-copper-deep)]">All entries <ArrowUpRight className="size-4" /></Link>
          </div>
          {entries.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{entries.slice(0, 3).map((entry) => <EncyclopediaCard key={entry.id} entry={entry} />)}</div> : <p className="mt-4 border-t border-[var(--color-line)] py-4 text-sm text-[var(--color-muted)]">No encyclopedia entries are available to preview yet.</p>}
        </section>

        <section className="mt-14" aria-labelledby="explore-areas-heading">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line-strong)] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">Browse by area</p>
              <h2 id="explore-areas-heading" className="font-editorial mt-2 text-2xl leading-tight text-[var(--color-ink)] sm:text-3xl">Explore Chitral</h2>
            </div>
          </div>
          <div className="mt-2 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink href="/explore" icon={BookOpen} title="Encyclopedia" detail="Culture, history, heritage, and local knowledge" />
            <QuickLink href="/profile" icon={Compass} title="Chitral Profile" detail="A regional overview of place, culture, and heritage" />
            <QuickLink href="/discover" icon={Compass} title="Places" detail="Explore the places directory" />
            <QuickLink href="/news" icon={Newspaper} title="News" detail="Read updates with their sources" />
            <QuickLink href="/music" icon={Music} title="Music" detail="Browse Chitral music records" />
            <QuickLink href="/food" icon={UtensilsCrossed} title="Food" detail="Traditional Chitral dishes and culinary context" />
            <QuickLink href="/khowar" icon={Languages} title="Khowar" detail="Explore language and available sources" />
            <QuickLink href="/safety" icon={ShieldAlert} title="Safety" detail="Review current records and advisories" />
            <QuickLink href="/map" icon={Map} title="Map" detail="View mapped places and safety records" />
          </div>
        </section>

        <AssistantPanel sectionId="ask-chaythraar" />
      </main>
    </AppShell>
  );
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof BookOpen; title: string; detail: string }) {
  return <Link href={href} className="group flex min-h-[76px] items-center gap-4 border-b border-[var(--color-line)] py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
    <Icon className="size-5 shrink-0 text-[var(--color-copper-deep)]" />
    <span className="min-w-0"><span className="block font-semibold text-[var(--color-ink)]">{title}</span><span className="mt-1 block text-sm leading-5 text-[var(--color-muted)]">{detail}</span></span>
    <ArrowUpRight className="ml-auto size-4 shrink-0 text-[var(--color-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
  </Link>;
}