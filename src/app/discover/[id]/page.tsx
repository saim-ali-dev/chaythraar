import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import { getPlaceById } from "@/lib/supabase/places";

export const dynamic = "force-dynamic";

type PlacePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { id } = await params;
  const { place } = await getPlaceById(id);
  return place ? { title: place.name, description: place.description ?? `Explore ${place.name} in Chitral.` } : { title: "Place" };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  const { place, error } = await getPlaceById(id);
  if (!place && !error) notFound();

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-5xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        {error ? <PlaceError message={error} /> : place ? <>
          <Link href="/discover" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><ArrowLeft className="size-4" />Back to Places</Link>
          <article className="mt-6">
            <header className="grid items-start gap-7 border-b border-[var(--color-line-strong)] pb-8 lg:grid-cols-[1fr_0.82fr] lg:items-center">
              <div><Badge tone="copper">{place.category} · Chitral</Badge><h1 className="font-editorial mt-4 text-4xl leading-tight text-[var(--color-ink)] sm:text-5xl">{place.name}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-slate)]">{place.description ?? "No description is available for this place."}</p></div>
              <MediaFrame src={place.image_url} alt={place.name} fallbackTitle={place.name} fallbackDetail={place.category} className="aspect-[4/3] border border-[var(--color-line)]" sizes="(max-width: 1024px) 100vw, 40vw" />
            </header>
            <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.52fr]" aria-labelledby="place-information-heading">
              <div>
                <h2 id="place-information-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Place information</h2>
                <dl className="mt-4 grid gap-x-8 gap-y-5 border-y border-[var(--color-line)] py-5 sm:grid-cols-2">
                  <div><dt className="text-xs text-[var(--color-muted)]">Category</dt><dd className="mt-1 font-medium text-[var(--color-ink)]">{place.category}</dd></div>
                  {(place.opening_time || place.closing_time) && <div><dt className="text-xs text-[var(--color-muted)]">Hours</dt><dd className="mt-1 inline-flex items-center gap-2 font-medium text-[var(--color-ink)]"><Clock3 className="size-4 text-[var(--color-copper-deep)]" />{formatHours(place.opening_time, place.closing_time)}</dd></div>}
                  {shouldShowSource(place.source) && <div><dt className="text-xs text-[var(--color-muted)]">Source</dt><dd className="mt-1 font-medium text-[var(--color-ink)]">{place.source}</dd></div>}
                  {place.latitude !== null && place.longitude !== null && <div><dt className="text-xs text-[var(--color-muted)]">Coordinates</dt><dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-[var(--color-ink)]"><MapPin className="size-4 text-[var(--color-copper-deep)]" />{place.latitude}, {place.longitude}</dd></div>}
                </dl>
                <Link href="/map" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Open the map <MapPin className="size-4" /></Link>
              </div>
              <Card className="h-fit bg-[var(--color-sand)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">About this record</p><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">Information is limited to details available in this place record.</p></Card>
            </section>
          </article>
        </> : null}
      </main>
    </AppShell>
  );
}

function PlaceError({ message }: { message: string }) {
  return <Card className="mt-8 border-l-4 border-l-[var(--color-danger-deep)] bg-[var(--color-sand)] p-6" role="alert"><h1 className="text-xl font-semibold text-[var(--color-ink)]">This place is temporarily unavailable.</h1><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">{message}</p><Link href="/discover" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)]"><ArrowLeft className="size-4" />Back to Places</Link></Card>;
}

function formatHours(opening: string | null, closing: string | null): string {
  if (opening && closing) return `${opening} - ${closing}`;
  return opening ? `Opens ${opening}` : `Closes ${closing}`;
}

function shouldShowSource(source: string | null) {
  return source !== null && !source.startsWith("OpenStreetMap contributors");
}