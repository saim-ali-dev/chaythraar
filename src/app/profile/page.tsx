import Link from "next/link";
import { ArrowUpRight, Mountain, Music4, UtensilsCrossed, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { getSiteMediaByKey } from "@/lib/supabase/site-media";

const profileHighlights = [
  { title: "Geography", detail: "Chitral is a high mountain district in northern Khyber Pakhtunkhwa, defined by the Hindu Kush, glacial valleys, and seasonal passes." },
  { title: "Languages", detail: "Khowar is the principal local language, while Chitral also contains diverse linguistic and cultural communities." },
  { title: "Culture", detail: "A layered heritage shaped by mountain settlements, local traditions, ritual life, and community festivals." },
  { title: "Heritage", detail: "The archive documents place-based knowledge, historical memory, and living cultural practice across the district." },
];

const focusAreas = [
  { title: "Music", href: "/music", detail: "Khowar song traditions, instrumental references, and cultural performance context.", icon: Music4 },
  { title: "Food", href: "/food", detail: "Traditional Chitrali dishes and foodways in documented local context.", icon: UtensilsCrossed },
  { title: "Place and landscape", href: "/explore", detail: "Valleys, history, geography, and heritage across Chitral.", icon: Mountain },
  { title: "Communities", href: "/team", detail: "The people and contributors behind CHAYTHRAAR.", icon: UsersRound },
];

export default async function ChitralProfilePage() {
  const profileHero = await getSiteMediaByKey("profile_hero");

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Chitral profile"
          title="A living profile of Chitral"
          description="This overview brings together the main threads of Chitral's identity: geography, language, heritage, music, food, and community memory."
        />

        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="border border-[var(--color-line)] bg-[var(--color-sand)] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">Overview</p>
            <p className="mt-4 text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              Chitral is a mountain district whose identity is defined by the Hindu Kush, high-altitude valleys, and the layered cultural traditions of its communities. Its local knowledge is carried through language, ritual practice, seasonal festivals, food, landscape memory, and oral culture.
            </p>
            <p className="mt-4 text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              CHAYTHRAAR frames this profile as a concise introduction rather than a replacement for the deeper archive. The aim is to connect place, heritage, and lived cultural practice in a way that is easy to navigate and grounded in sourced records.
            </p>
          </Card>

          <MediaFrame
            src={profileHero?.image_url ?? null}
            alt="Profile image for Chitral"
            fallbackTitle="Chitral landscape"
            fallbackDetail="Chitral profile"
            className="aspect-[4/3] overflow-hidden border border-[var(--color-line)]"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.65fr_1.35fr]">
          <Card className="border border-[var(--color-line)] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">Quick facts</p>
            <dl className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-slate)]">
              <div>
                <dt className="font-semibold text-[var(--color-ink)]">Setting</dt>
                <dd>High mountain valleys and passes in northern Pakistan</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-ink)]">Language</dt>
                <dd>Khowar and a broader multilingual local context</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-ink)]">Cultural anchor</dt>
                <dd>Festival life, oral heritage, and place-based knowledge</dd>
              </div>
            </dl>
          </Card>

          <Card className="border border-[var(--color-line)] bg-[var(--color-sand)] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">Place matters</p>
            <p className="mt-4 text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              The physical setting of Chitral is inseparable from its cultural identity: valleys, passes, glaciers, and mountain routes shape movement, memory, and livelihood. The archive treats landscape as a living part of heritage rather than decoration.
            </p>
          </Card>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Key threads</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {profileHighlights.map((item) => (
              <Card key={item.title} className="border border-[var(--color-line)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--color-slate)]">{item.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Explore the archive</h2>
            <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-copper-deep)]">
              Browse all entries <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {focusAreas.map(({ title, href, detail, icon: Icon }) => (
              <Link key={title} href={href} className="group block rounded-xl border border-[var(--color-line)] bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-line-strong)] hover:shadow-[0_10px_28px_rgba(28,43,53,0.08)]">
                <Icon className="size-5 text-[var(--color-copper-deep)]" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">{detail}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                  Open section <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
