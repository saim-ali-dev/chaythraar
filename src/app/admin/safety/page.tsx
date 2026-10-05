import { redirect } from "next/navigation";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { AdminSafetyModeration } from "@/components/admin/admin-safety-moderation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminSafetyPage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fsafety");
  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Administration"
          title="Safety moderation"
          description="Review community-submitted hazard reports. Only administrator approval makes a report public."
        />
        <AdminAreaNav current="/admin/safety" />
        <AdminSafetyModeration />
      </main>
    </AppShell>
  );
}
