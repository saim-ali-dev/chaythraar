import { NewsBrowser } from "@/components/news/news-browser";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getNewsEntries } from "@/lib/supabase/news";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const entries = await getNewsEntries();

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="News · Local reporting"
          title="News and updates"
          description="Browse published updates with their source, category, date, and original language kept in view."
        />
        <NewsBrowser entries={entries} />
      </main>
    </AppShell>
  );
}
