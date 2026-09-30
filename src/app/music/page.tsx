import { EncyclopediaBrowser } from "@/components/encyclopedia/encyclopedia-browser";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const allEntries = await getEncyclopediaEntries();
  const musicEntries = allEntries.filter((entry) => entry.category.trim().toLowerCase() === "music");

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Culture · Music"
          title="Music of Chitral"
          description="A place to discover sourced records of Chitral's musical traditions and related cultural knowledge."
        />
        {musicEntries.length > 0 ? <EncyclopediaBrowser
          entries={musicEntries}
          heading="Music records"
          singularItemLabel="record"
          pluralItemLabel="records"
          showCategoryFilter={false}
        /> : <Card className="border-t-2 border-t-[var(--color-copper)] bg-[var(--color-sand)] p-6" role="status">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">No sourced Music records are available to display.</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">No placeholder records are shown while the Music archive is empty.</p>
        </Card>}
      </main>
    </AppShell>
  );
}