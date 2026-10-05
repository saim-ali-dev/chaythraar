import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EncyclopediaBrowser } from "@/components/encyclopedia/encyclopedia-browser";
import { isFoodCategory } from "@/lib/content-categories";
import { getEncyclopediaEntries } from "@/lib/supabase/encyclopedia";

export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const entries = await getEncyclopediaEntries();
  const foodEntries = entries.filter((entry) => isFoodCategory(entry.category));

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Culture · Food"
          title="Food of Chitral"
          description="A concise archive of traditional Chitrali foods, culinary identity, and the local knowledge that surrounds daily and seasonal eating practices."
        />

        <section className="mb-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-[var(--color-line)] bg-[var(--color-sand)] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">Food culture</p>
            <p className="mt-4 text-base leading-7 text-[var(--color-slate)] sm:text-lg">
              Chitral&apos;s food traditions are shaped by mountain geography, seasonal production, family practice, and a strong link between local ingredients and daily life. This archive keeps the emphasis on documented local dishes rather than broad regional assumptions.
            </p>
          </Card>
          <Card className="border border-[var(--color-line)] bg-white p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-copper-deep)]">Featured dishes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-slate)]">
              {foodEntries.slice(0, 3).map((entry) => <li key={entry.id}>{entry.title}</li>)}
            </ul>
            <Link href="/explore" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-copper-deep)]">
              Explore the archive <ArrowUpRight className="size-4" />
            </Link>
          </Card>
        </section>

        {foodEntries.length > 0 ? (
          <EncyclopediaBrowser
            entries={foodEntries}
            heading="Traditional food records"
            singularItemLabel="dish"
            pluralItemLabel="dishes"
            showCategoryFilter={false}
          />
        ) : (
          <Card className="border-t-2 border-t-[var(--color-copper)] bg-[var(--color-sand)] p-6" role="status">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">No sourced food records are available to display.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">The archive keeps this section focused on documented Chitral foods and avoids unsupported claims.</p>
          </Card>
        )}
      </main>
    </AppShell>
  );
}
