import { Compass } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlaceBrowser } from "@/components/discover/place-browser";
import { getPlaces } from "@/lib/supabase/places";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { places, error } = await getPlaces();

  return <AppShell><main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-16"><section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><Badge tone="copper">Discover · Live places</Badge><h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)] sm:text-6xl">Find a meaningful place to begin.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-slate)]">Browse verified places from the CHAYTHRAAR places directory, with local context kept close.</p></div><Compass className="hidden size-12 text-[var(--color-copper)] sm:block" /></section>{error ? <PlaceError message={error} /> : places.length === 0 ? <EmptyPlaces /> : <PlaceBrowser places={places} />}</main></AppShell>;
}

function EmptyPlaces() {
  return <Card className="bg-[var(--color-sand)] p-8 sm:p-10"><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">No places are available yet.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">The live places directory is empty. No demo places or unverified coordinates are shown.</p></Card>;
}

function PlaceError({ message }: { message: string }) {
  return <Card className="border-[var(--color-copper)]/30 bg-[var(--color-sand)] p-8 sm:p-10"><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Places are temporarily unavailable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">{message}</p></Card>;
}
