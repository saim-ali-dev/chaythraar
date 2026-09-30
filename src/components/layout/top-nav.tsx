"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const primaryItems = navigationItems.filter((item) => ["/", "/explore", "/discover", "/news"].includes(item.href));
  const secondaryItems = navigationItems.filter((item) => ["/safety", "/khowar", "/map"].includes(item.href));
  const secondaryActive = secondaryItems.some((item) => item.href === pathname);

  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
      {primaryItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]", active ? "bg-[var(--color-ink)] font-semibold text-white" : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")} aria-current={active ? "page" : undefined}>
            <Icon className="size-4" />{label}
          </Link>
        );
      })}
      <details className="group relative">
        <summary className={cn("flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]", secondaryActive ? "bg-[var(--color-mist)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")}>
          More <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-[var(--color-line)] bg-white p-2 shadow-lg">
          {secondaryItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors", pathname === href ? "bg-[var(--color-mist)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-slate)] hover:bg-[var(--background)] hover:text-[var(--color-ink)]")}><Icon className="size-4" />{label}</Link>)}
          <Link href="/#ask-chaythraar" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[var(--color-slate)] transition-colors hover:bg-[var(--background)] hover:text-[var(--color-ink)]"><Sparkles className="size-4" />Ask CHAYTHRAAR</Link>
        </div>
      </details>
    </nav>
  );
}
