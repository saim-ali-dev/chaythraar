import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Image as ImageIcon,
  Languages,
  MapPinned,
  Newspaper,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";

type AdminCounts = {
  encyclopedia: number | null;
  places: number | null;
  news: number | null;
  safety: number | null;
  khowar: number | null;
  knowledge: number | null;
};

const modules = [
  { title: "Encyclopedia", description: "Review and maintain regional knowledge records.", icon: BookOpen, href: "/admin/encyclopedia" },
  { title: "Places and tourism", description: "Manage place descriptions, coordinates, and imagery.", icon: MapPinned, href: "/admin/places" },
  { title: "News", description: "Review source records and refresh the news feed.", icon: Newspaper, href: "/admin/news" },
  { title: "Safety", description: "Review community reports and moderation status.", icon: ShieldAlert, href: "/admin/safety" },
  { title: "Khowar", description: "Manage translations and inspect attributed lexical records.", icon: Languages, href: "/admin/khowar" },
  { title: "Media", description: "Manage image URLs and attribution across the archive.", icon: ImageIcon, href: "/admin/images" },
  { title: "AI and knowledge", description: "Inspect retrieval, test answers, and rebuild source indexes.", icon: BrainCircuit, href: "/admin/knowledge" },
  { title: "System", description: "Review data and service health and update your account password.", icon: Settings2, href: "/admin/system" },
];

const countItems: Array<{ label: string; key: keyof AdminCounts }> = [
  { label: "Encyclopedia", key: "encyclopedia" },
  { label: "Places", key: "places" },
  { label: "News", key: "news" },
  { label: "Safety reports", key: "safety" },
  { label: "Khowar entries", key: "khowar" },
  { label: "Knowledge chunks", key: "knowledge" },
];

export function AdminDashboard({ email, counts }: { email: string; counts: AdminCounts }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="admin-overview-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line-strong)] pb-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Overview</p><h2 id="admin-overview-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Archive status</h2></div>
          <p className="text-sm text-[var(--color-muted)]">Signed in as {email}</p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-6">
          {countItems.map(({ label, key }) => <div key={key} className="border-b border-[var(--color-line)] py-3"><dt className="text-xs text-[var(--color-muted)]">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-ink)]">{counts[key] ?? "--"}</dd></div>)}
        </dl>
      </section>

      <section aria-labelledby="admin-modules-heading">
        <div className="flex items-end justify-between gap-3 border-b border-[var(--color-line-strong)] pb-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Workspace</p><h2 id="admin-modules-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Management areas</h2></div><p className="text-xs text-[var(--color-muted)]">{modules.length} available</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ title, description, icon: Icon, href }) => {
            const content = <><div className="flex items-center justify-between gap-3"><Icon className="size-5 text-[var(--color-copper-deep)]" aria-hidden="true" /><span className={`text-xs font-semibold ${href ? "text-green-800" : "text-[var(--color-muted)]"}`}>{href ? "Available" : "Planned"}</span></div><h3 className="mt-4 font-semibold text-[var(--color-ink)]">{title}</h3><p className="mt-1 text-sm leading-5 text-[var(--color-slate)]">{description}</p></>;
            return href
              ? <Link key={title} href={href} className="block border border-[var(--color-line)] bg-white p-4 transition-colors hover:border-[var(--color-copper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">{content}</Link>
              : <Card key={title} className="border-[var(--color-line)] bg-[var(--color-mist)] p-4">{content}</Card>;
          })}
        </div>
      </section>
    </div>
  );
}