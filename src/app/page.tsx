import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Languages, Map, Music, Newspaper, ShieldAlert, UtensilsCrossed } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { MediaFrame } from "@/components/ui/media-frame";
import { EncyclopediaCard } from "@/components/encyclopedia/encyclopedia-card";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";
import { getNewsEntries } from "@/lib/supabase/news";
import { getSiteMediaByKey } from "@/lib/supabase/site-media";
import { CURATED_IMAGES } from "@/lib/curated-images";
import { getSafeImageSource } from "@/lib/media-images";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [entries, newsEntries, profileHero] = await Promise.all([
    getEncyclopediaEntries(),
    getNewsEntries(),
    getSiteMediaByKey("profile_hero"),
  ]);
  const recentNews = newsEntries[0] ?? null;
  const storedHero = profileHero && getSafeImageSource(profileHero.image_url, Boolean(profileHero.image_source?.trim() && profileHero.image_license?.trim()))
    ? profileHero
    : null;
  const heroImage = storedHero ? {
    src: storedHero.image_url ?? CURATED_IMAGES.chitralTown.src,
    imageSource: storedHero.image_source,
    imageCredit: storedHero.image_credit,
    imageLicense: storedHero.image_license,
  } : CURATED_IMAGES.chitralTown;

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
          <Link href="/profile" className="group block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
            <MediaFrame
              src={heroImage.src}
              alt={storedHero ? "Image selected for the Chitral regional profile" : CURATED_IMAGES.chitralTown.alt}
              fallbackTitle="Hindu Kush · Chitral"
              fallbackDetail="Regional profile"
              imageSource={heroImage.imageSource}
              imageSourceUrl={"imageSourceUrl" in heroImage ? heroImage.imageSourceUrl : undefined}
              imageCredit={heroImage.imageCredit}
              imageLicense={heroImage.imageLicense}
              imageLicenseUrl={"imageLicenseUrl" in heroImage ? heroImage.imageLicenseUrl : undefined}
              imageChanges={"imageChanges" in heroImage ? heroImage.imageChanges : undefined}
              className="aspect-[4/3] border border-[var(--color-line)] sm:aspect-[16/10]"
              sizes="(max-width: 1024px) 100vw, 45vw"
              preload
            />
            <div className="mt-3 flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] pb-3">
              <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-copper-deep)]">Chitral and the Hindu Kush</span>
              <span className="shrink-0 text-xs text-[var(--color-muted)]">Regional profile</span>
            </div>
          </Link>
        </section>

        <section className="mt-10" aria-labelledby="home-visual-guides-heading">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line-strong)] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-copper-deep)]">A closer look</p>
              <h2 id="home-visual-guides-heading" className="font-editorial mt-2 text-2xl leading-tight text-[var(--color-ink)] sm:text-3xl">Stories, places, and living heritage</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <HomeMediaCard
              href="/explore"
              eyebrow="Heritage & culture"
              title={CURATED_IMAGES.chilamJosh.title}
              detail="A source-documented photograph of Chilam Josh in Bumburet."
              image={CURATED_IMAGES.chilamJosh}
            />
            <HomeMediaCard
              href="/discover"
              eyebrow="Places & tourism"
              title={CURATED_IMAGES.qaqlashtMeadows.title}
              detail="High meadows above Booni, documented by the original photographer."
              image={CURATED_IMAGES.qaqlashtMeadows}
            />
            <HomeMediaCard
              href="/news"
              eyebrow="Recent news"
              title={recentNews?.headline ?? recentNews?.title ?? "News from the network"}
              detail={recentNews ? `Latest update · ${recentNews.source}` : "Local reporting with original sources."}
              src={recentNews?.image_url ?? null}
              alt={recentNews ? `Article image associated with ${recentNews.headline ?? recentNews.title}` : ""}
              imageSource={recentNews?.image_source}
              imageCredit={recentNews?.image_credit}
              imageLicense={recentNews?.image_license}
            />
          </div>
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

function HomeMediaCard({
  href,
  eyebrow,
  title,
  detail,
  src,
  alt,
  imageSource,
  imageCredit,
  imageLicense,
  image,
  imageSourceUrl,
  imageLicenseUrl,
  imageChanges,
}: {
  href: string;
  eyebrow: string;
  title: string;
  detail: string;
  src?: string | null;
  alt?: string;
  imageSource?: string | null;
  imageSourceUrl?: string | null;
  imageCredit?: string | null;
  imageLicense?: string | null;
  imageLicenseUrl?: string | null;
  imageChanges?: string | null;
  image?: typeof CURATED_IMAGES[keyof typeof CURATED_IMAGES];
}) {
  return <Link href={href} className="group min-w-0 border border-[var(--color-line)] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">
    <MediaFrame src={image?.src ?? src ?? null} alt={image?.alt ?? alt ?? ""} fallbackTitle={title} fallbackDetail={eyebrow} imageSource={image?.imageSource ?? imageSource} imageSourceUrl={image?.imageSourceUrl ?? imageSourceUrl} imageCredit={image?.imageCredit ?? imageCredit} imageLicense={image?.imageLicense ?? imageLicense} imageLicenseUrl={image?.imageLicenseUrl ?? imageLicenseUrl} imageChanges={image?.imageChanges ?? imageChanges} className="aspect-[4/3] border-b border-[var(--color-line)]" sizes="(max-width: 768px) 100vw, 33vw" />
    <div className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">{eyebrow}</p>
      <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-[var(--color-ink)] group-hover:text-[var(--color-copper-deep)]">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-[var(--color-slate)]">{detail}</p>
    </div>
  </Link>;
}