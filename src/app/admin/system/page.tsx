import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccountSettings } from "@/components/admin/admin-account-settings";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminUser, isAdminAuthConfigured } from "@/lib/admin-auth";
import { parseAdminEmailAllowlist } from "@/lib/admin-access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const tableCounts = [
  ["Encyclopedia", "encyclopedia"], ["Places", "places"], ["News", "news"],
  ["Hazards", "hazards"], ["Translations", "translations"], ["Khowar lexicon", "khowar_lexicon"],
  ["Glossary entries", "khowar_glossary"], ["Knowledge chunks", "knowledge_chunks"],
] as const;

export default async function AdminSystemPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin?next=%2Fadmin%2Fsystem");
  const supabase = createAdminSupabaseClient();
  const counts = await Promise.all(tableCounts.map(([, table]) => supabase.from(table)
    .select("id", { count: "exact", head: true })));
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let projectRef: string | null = null;
  try {
    projectRef = projectUrl ? new URL(projectUrl).hostname.split(".")[0] : null;
  } catch {
    projectRef = null;
  }
  const allowlist = [...parseAdminEmailAllowlist()];
  const services = [
    ["Supabase database", Boolean(projectUrl && process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["Gemini embeddings", Boolean(process.env.GEMINI_API_KEY)],
    ["Answer completion", Boolean(process.env.GROQ_API_KEY && process.env.NEWS_AI_API_URL && process.env.NEWS_AI_MODEL)],
    ["Voyage Khowar embeddings", Boolean(process.env.VOYAGE_API_KEY)],
  ] as const;

  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Administration · System" title="System health" description="Review data volumes, service configuration, and your administrator account." /><AdminAreaNav current="/admin/system" /><section aria-labelledby="system-data-heading"><h2 id="system-data-heading" className="border-b border-[var(--color-line-strong)] pb-3 text-xl font-semibold text-[var(--color-ink)]">Data statistics</h2><dl className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-4">{tableCounts.map(([label], index) => <div key={label} className="border-b border-[var(--color-line)] py-3"><dt className="text-xs text-[var(--color-muted)]">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-ink)]">{counts[index].error ? "--" : counts[index].count ?? 0}</dd></div>)}</dl></section><section className="mt-10" aria-labelledby="system-services-heading"><h2 id="system-services-heading" className="border-b border-[var(--color-line-strong)] pb-3 text-xl font-semibold text-[var(--color-ink)]">Service configuration</h2><ul className="mt-2 divide-y divide-[var(--color-line)]">{services.map(([label, ready]) => <li key={label} className="flex min-h-12 items-center justify-between gap-3 py-2"><span className="text-sm text-[var(--color-ink)]">{label}</span><span className={`text-xs font-semibold ${ready ? "text-green-800" : "text-[var(--color-danger-deep)]"}`}>{ready ? "Configured" : "Missing configuration"}</span></li>)}</ul></section><section className="mt-10 border-t border-[var(--color-line-strong)] pt-5" aria-labelledby="admin-access-heading"><h2 id="admin-access-heading" className="text-lg font-semibold text-[var(--color-ink)]">Administrator access</h2><p className="mt-2 text-sm text-[var(--color-slate)]">Email allowlist: {isAdminAuthConfigured() ? `${allowlist.length} administrator${allowlist.length === 1 ? "" : "s"} configured` : "not configured"}</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-slate)]">Add or remove administrator emails with the server-only <code>CHAYTHRAAR_ADMIN_EMAILS</code> setting, then restart the server. Create and confirm Supabase Auth users in the Supabase Dashboard; public sign-up is disabled.</p>{projectRef && <Link href={`https://supabase.com/dashboard/project/${projectRef}/auth/users`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--color-copper-deep)] underline underline-offset-2">Manage Supabase Auth users</Link>}</section><AdminAccountSettings email={user.email ?? "Administrator"} /></main></AppShell>;
}