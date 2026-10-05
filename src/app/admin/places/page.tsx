import { redirect } from "next/navigation";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AdminContentManager } from "@/components/admin/admin-content-manager";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPlacesPage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fplaces");
  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Administration · Discovery" title="Places and tourism" description="Manage place names, descriptions, coordinates, hours, and source details." /><AdminAreaNav current="/admin/places" /><AdminContentManager entity="places" /></main></AppShell>;
}