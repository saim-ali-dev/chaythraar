"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
      {navigationItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]", active ? "bg-[var(--color-ink)] font-semibold text-white" : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")} aria-current={active ? "page" : undefined}>
            <Icon className="size-4" />{label}
          </Link>
        );
      })}
    </nav>
  );
}
