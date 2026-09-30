import { EncyclopediaBrowser } from "@/components/encyclopedia/encyclopedia-browser";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const entries = await getEncyclopediaEntries();

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Explore · Encyclopedia"
          title="A growing record of Chitral"
          description="Browse cultural, historical, and place-based entries, with source information kept alongside each article."
        />
        <EncyclopediaBrowser entries={entries} />
      </main>
    </AppShell>
  );
}