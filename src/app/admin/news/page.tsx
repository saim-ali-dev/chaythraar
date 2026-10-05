import { redirect } from "next/navigation";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AdminNewsManager } from "@/components/admin/admin-news-manager";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fnews");
  return <AppShell><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Administration · News" title="News and sources" description="Review source-linked items and refresh the configured Chitral Times and ChitralToday feeds." /><AdminAreaNav current="/admin/news" /><AdminNewsManager /></main></AppShell>;
}