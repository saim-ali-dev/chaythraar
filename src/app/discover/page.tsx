import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PlaceBrowser } from "@/components/discover/place-browser";
import { getPlaces } from "@/lib/supabase/places";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const { places, error } = await getPlaces();

  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="compact" eyebrow="Places · Discover" title="Places across Chitral" description="Explore place records with available descriptions, imagery, opening information, and source context." />{error ? <PlaceError message={error} /> : places.length === 0 ? <EmptyPlaces /> : <PlaceBrowser places={places} />}</main></AppShell>;
}

function EmptyPlaces() {
  return <Card className="bg-[var(--color-sand)] p-8 sm:p-10"><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">No places are available yet.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">The live places directory is empty. No demo places or unverified coordinates are shown.</p></Card>;
}

function PlaceError({ message }: { message: string }) {
  return <Card className="border-[var(--color-copper)]/30 bg-[var(--color-sand)] p-8 sm:p-10"><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">Places are temporarily unavailable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">{message}</p></Card>;
}
