import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Languages, Map, Newspaper, ShieldAlert } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { encyclopediaTopics, newsItems, safetyItems } from "@/data/demo-content";

export default function Home() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        <section className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <Badge tone="copper">Chitral, Pakistan · Demo experience</Badge>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">
              One intelligent place for Chitral.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              A thoughtful starting point for local knowledge, discovery, language, safety, and the stories that connect a region.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[var(--color-green-deep)]" />Built for curious minds</span>
              <span className="hidden h-4 w-px bg-[var(--color-line-strong)] sm:block" />
              <span>Local-first by design</span>
            </div>
          </div>
          <div className="relative min-h-64 overflow-hidden rounded-[2rem] border border-[var(--color-line-strong)] bg-[var(--color-ink)] p-7 text-white shadow-[0_24px_70px_rgba(25,40,54,0.14)] sm:min-h-80 sm:p-9">
            <div className="absolute -right-14 -top-20 size-56 rounded-full border border-white/10" />
            <div className="absolute -bottom-20 left-8 size-72 rounded-full border border-white/10" />
            <div className="relative flex h-full min-h-48 flex-col justify-between">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/55"><span>Field notes</span><span>01 / 06</span></div>
              <div>
                <div className="mb-5 flex items-end gap-2 opacity-90"><span className="block h-20 w-24 -skew-x-12 bg-[var(--color-copper)]" /><span className="block h-12 w-20 -skew-x-12 bg-white/20" /><span className="block h-7 w-16 -skew-x-12 bg-white/10" /></div>
                <p className="max-w-xs text-xl font-medium leading-7">A living index for learning the shape of a place.</p>
              </div>
            </div>
          </div>
        </section>

        <AssistantPanel />

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-copper)]">Start somewhere</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Explore the platform</h2></div><span className="hidden text-sm text-[var(--color-muted)] sm:block">Six ways in</span></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink href="/explore" icon={BookOpen} title="Explore" detail="Build context around Chitral." />
            <QuickLink href="/discover" icon={Compass} title="Discover" detail="Find a place to begin." />
            <QuickLink href="/news" icon={Newspaper} title="News" detail="Keep an eye on local updates." />
            <QuickLink href="/safety" icon={ShieldAlert} title="Safety" detail="Prepare with trusted context." />
            <QuickLink href="/khowar" icon={Languages} title="Khowar" detail="Make language a bridge." />
            <QuickLink href="/map" icon={Map} title="Map" detail="See the region spatially." />
          </div>
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-copper)]">Knowledge base</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">A better place to start learning</h2></div><BookOpen className="size-5 text-[var(--color-copper)]" /></div><div className="mt-7 grid gap-3 sm:grid-cols-3">{encyclopediaTopics.map((topic) => <div key={topic.id} className="border-t border-[var(--color-line)] pt-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{topic.category}</p><h3 className="mt-2 font-semibold">{topic.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">{topic.summary}</p></div>)}</div></Card>
          <Card className="bg-[var(--color-sand)] p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-copper)]">What&apos;s happening</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">A calm pulse on the region</h2></div><Badge>Demo data</Badge></div><div className="mt-6 space-y-5">{newsItems.slice(0, 2).map((item) => <div key={item.id} className="border-t border-[var(--color-line-strong)] pt-4"><p className="text-xs text-[var(--color-muted)]">{item.category} · {item.dateLabel}</p><h3 className="mt-1 font-medium leading-6">{item.title}</h3></div>)}<div className="border-t border-[var(--color-line-strong)] pt-4"><p className="text-xs text-[var(--color-muted)]">Safety note · Demo content</p><p className="mt-1 text-sm leading-6 text-[var(--color-slate)]">{safetyItems[0].detail}</p></div></div></Card>
        </section>
      </main>
    </AppShell>
  );
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof BookOpen; title: string; detail: string }) {
  return <Link href={href} className="group flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--color-copper)] hover:shadow-[0_12px_28px_rgba(25,40,54,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-mist)] text-[var(--color-copper)] transition-colors group-hover:bg-[var(--color-copper-soft)]"><Icon className="size-5" /></span><span className="min-w-0"><span className="block font-semibold text-[var(--color-ink)]">{title}</span><span className="mt-1 block truncate text-sm text-[var(--color-muted)]">{detail}</span></span><ArrowUpRight className="ml-auto size-4 shrink-0 text-[var(--color-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>;
}
