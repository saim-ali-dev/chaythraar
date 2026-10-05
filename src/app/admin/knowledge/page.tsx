import { redirect } from "next/navigation";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AdminKnowledgeOps } from "@/components/admin/admin-knowledge-ops";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { SatelliteMonitoringPanel } from "@/components/map/satellite-monitoring-panel";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const sourceTypes = ["encyclopedia", "place", "news", "safety", "translation", "khowar_lexicon"] as const;

export default async function AdminKnowledgePage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fknowledge");
  const supabase = createAdminSupabaseClient();
  const results = await Promise.all(sourceTypes.map((sourceType) => supabase.from("knowledge_chunks")
    .select("id", { count: "exact", head: true }).eq("source_type", sourceType)));
  const glossaryChunks = await supabase.from("khowar_glossary_chunks").select("id", { count: "exact", head: true });

  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Administration · AI" title="Knowledge and retrieval" description="Inspect indexed sources, run a retrieval check, and rebuild individual knowledge indexes." /><AdminAreaNav current="/admin/knowledge" /><section aria-labelledby="index-status-heading"><h2 id="index-status-heading" className="border-b border-[var(--color-line-strong)] pb-3 text-xl font-semibold text-[var(--color-ink)]">Indexed chunks</h2><dl className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">{sourceTypes.map((sourceType, index) => <div key={sourceType} className="border-b border-[var(--color-line)] py-3"><dt className="text-xs capitalize text-[var(--color-muted)]">{sourceType.replaceAll("_", " ")}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-ink)]">{results[index].error ? "--" : results[index].count ?? 0}</dd></div>)}<div className="border-b border-[var(--color-line)] py-3"><dt className="text-xs text-[var(--color-muted)]">Khowar glossary vectors</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-ink)]">{glossaryChunks.error ? "--" : glossaryChunks.count ?? 0}</dd></div></dl></section><AdminKnowledgeOps /><section className="mt-10" aria-labelledby="satellite-admin-heading"><h2 id="satellite-admin-heading" className="mb-4 border-b border-[var(--color-line-strong)] pb-3 text-xl font-semibold text-[var(--color-ink)]">Satellite data status</h2><SatelliteMonitoringPanel /></section><AssistantPanel sectionId="admin-retrieval-check" initialValue="What can CHAYTHRAAR explain about Chitral from its available sources?" /></main></AppShell>;
}