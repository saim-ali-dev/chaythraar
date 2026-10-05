import { redirect } from "next/navigation";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AdminContentManager } from "@/components/admin/admin-content-manager";
import { AdminKhowarDictionary } from "@/components/admin/admin-khowar-dictionary";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminKhowarPage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fkhowar");
  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Administration · Language" title="Khowar" description="Manage reviewed translations and inspect imported lexical records with their original attribution." /><AdminAreaNav current="/admin/khowar" /><section aria-labelledby="translations-heading"><h2 id="translations-heading" className="mb-4 border-b border-[var(--color-line-strong)] pb-3 text-xl font-semibold text-[var(--color-ink)]">Translations</h2><AdminContentManager entity="translations" /></section><section className="mt-12 border-t border-[var(--color-line-strong)] pt-6" aria-labelledby="lexicon-heading"><h2 id="lexicon-heading" className="text-xl font-semibold text-[var(--color-ink)]">Imported lexicon</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">Imported lexical source records are read-only here so their original text, license, and attribution remain intact.</p><AdminKhowarDictionary /></section></main></AppShell>;
}