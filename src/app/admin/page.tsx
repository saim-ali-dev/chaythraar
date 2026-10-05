import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { getAdminUser, isAdminAuthConfigured } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminPageProps = { searchParams: Promise<{ next?: string | string[] }> };

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const returnTo = requestedNext?.startsWith("/admin/") ? requestedNext : "/admin";
  const user = await getAdminUser();

  if (!user) {
    return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="compact" eyebrow="Administration" title="CHAYTHRAAR control center" description="Manage the archive, review community contributions, and monitor the knowledge system." /><AdminLogin configured={isAdminAuthConfigured()} returnTo={returnTo} /></main></AppShell>;
  }

  const supabase = createAdminSupabaseClient();
  const [encyclopedia, places, news, safety, khowar, knowledge] = await Promise.all([
    supabase.from("encyclopedia").select("id", { count: "exact", head: true }),
    supabase.from("places").select("id", { count: "exact", head: true }),
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("hazards").select("id", { count: "exact", head: true }).eq("source_type", "community"),
    supabase.from("khowar_lexicon").select("id", { count: "exact", head: true }),
    supabase.from("knowledge_chunks").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader variant="compact" eyebrow="Administration" title="CHAYTHRAAR control center" description="Manage the archive, review community contributions, and monitor the knowledge system." />
        <AdminAreaNav current="/admin" />
        <AdminDashboard email={user.email ?? "Administrator"} counts={{
          encyclopedia: encyclopedia.error ? null : encyclopedia.count ?? 0,
          places: places.error ? null : places.count ?? 0,
          news: news.error ? null : news.count ?? 0,
          safety: safety.error ? null : safety.count ?? 0,
          khowar: khowar.error ? null : khowar.count ?? 0,
          knowledge: knowledge.error ? null : knowledge.count ?? 0,
        }} />
      </main>
    </AppShell>
  );
}