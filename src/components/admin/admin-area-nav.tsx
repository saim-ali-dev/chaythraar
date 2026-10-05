import Link from "next/link";
import { AdminSignOut } from "@/components/admin/admin-sign-out";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/encyclopedia", label: "Encyclopedia" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/khowar", label: "Khowar" },
  { href: "/admin/knowledge", label: "AI & Knowledge" },
  { href: "/admin/images", label: "Image library" },
  { href: "/admin/safety", label: "Safety moderation" },
  { href: "/admin/system", label: "System" },
];

export function AdminAreaNav({ current }: { current: string }) {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3"><nav className="flex flex-wrap gap-2" aria-label="Administration">{links.map((link) => <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold transition-colors ${current === link.href ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line-strong)] bg-white text-[var(--color-slate)] hover:bg-[var(--color-mist)]"}`}>{link.label}</Link>)}</nav><AdminSignOut /></div>;
}
