import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

  return <AppShell><main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pt-14">{error ? <PlaceError message={error} /> : place ? <><Link href="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><ArrowLeft className="size-4" />Back to Discover</Link><article className="mt-8"><header className="grid gap-8 lg:grid-cols-[1fr_0.72fr]"><div><Badge tone="copper">{place.category} · Chitral</Badge><h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">{place.name}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-slate)]">{place.description ?? "No description is available for this place."}</p></div><div className="relative min-h-64 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-mist)]">{place.image_url ? <div role="img" aria-label={place.name} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${place.image_url}")` }} /> : <div className="flex h-full items-center justify-center text-[var(--color-copper)]"><MapPin className="size-12" /></div>}</div></header><div className="mt-10 grid gap-5 lg:grid-cols-[1fr_0.36fr]"><Card className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-copper)]">Place information</p><dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-[var(--color-muted)]">Category</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">{place.category}</dd></div>{(place.opening_time || place.closing_time) && <div><dt className="text-sm text-[var(--color-muted)]">Hours</dt><dd className="mt-1 inline-flex items-center gap-2 font-semibold text-[var(--color-ink)]"><Clock3 className="size-4 text-[var(--color-copper)]" />{formatHours(place.opening_time, place.closing_time)}</dd></div>}<div><dt className="text-sm text-[var(--color-muted)]">Coordinates</dt><dd className="mt-1 font-semibold text-[var(--color-ink)]">{place.latitude !== null && place.longitude !== null ? `${place.latitude}, ${place.longitude}` : "Not available"}</dd></div></dl>{place.source && <div className="mt-8 border-t border-[var(--color-line)] pt-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">Source</p><p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{place.source}</p></div>}</Card><Card className="h-fit bg-[var(--color-sand)] p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-copper)]">Explore spatially</p><p className="mt-3 text-sm leading-6 text-[var(--color-slate)]">Open this place on the Chitral map using its recorded coordinates.</p><Link href={`/map?place=${place.id}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-slate)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] focus-visible:ring-offset-2"><MapPin className="size-4" />View on map</Link>{place.source && <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">Source: {place.source}</p>}</Card></div></article></> : null}</main></AppShell>;
}

function PlaceError({ message }: { message: string }) {
  return <Card className="mt-8 bg-[var(--color-sand)] p-8"><h1 className="text-2xl font-semibold text-[var(--color-ink)]">This place is temporarily unavailable.</h1><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">{message}</p><Link href="/discover" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-copper-deep)]"><ArrowLeft className="size-4" />Back to Discover</Link></Card>;
}

function formatHours(opening: string | null, closing: string | null): string {
  if (opening && closing) return `${opening} - ${closing}`;
  return opening ? `Opens ${opening}` : `Closes ${closing}`;
}
