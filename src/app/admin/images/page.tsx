import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AdminImageManager } from "@/components/admin/admin-image-manager";
import { AdminAreaNav } from "@/components/admin/admin-area-nav";
import { getAdminUser } from "@/lib/admin-auth";

export default async function AdminImagesPage() {
  if (!await getAdminUser()) redirect("/admin?next=%2Fadmin%2Fimages");
  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          eyebrow="Administration"
          title="Image library"
          description="Manually manage image URLs and attribution for the existing archive, places, news, profile, and team records."
        />
        <AdminAreaNav current="/admin/images" />
        <AdminImageManager />
      </main>
    </AppShell>
  );
}
