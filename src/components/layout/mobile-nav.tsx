"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = navigationItems.filter((item) => ["/", "/explore", "/discover", "/safety", "/map"].includes(item.href));

  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-2xl border border-[var(--color-line-strong)] bg-white/95 p-2 shadow-[0_18px_50px_rgba(25,40,54,0.14)] backdrop-blur lg:hidden" aria-label="Mobile navigation">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return <Link key={href} href={href} className={cn("flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]", active ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]")} aria-current={active ? "page" : undefined}><Icon className="size-4" /><span>{label}</span></Link>;
      })}
    </nav>
  );
}
