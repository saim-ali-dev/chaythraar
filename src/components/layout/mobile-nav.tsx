"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Ellipsis, Sparkles } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = navigationItems.filter((item) => ["/", "/explore", "/discover", "/map"].includes(item.href));

  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-around rounded-full border border-[color-mix(in_srgb,var(--color-line-strong)_70%,transparent)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] p-1.5 shadow-[0_8px_24px_rgba(28,43,53,0.12),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--background)_76%,transparent)] lg:hidden" aria-label="Mobile navigation">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return <Link key={href} href={href} className={cn("flex min-w-14 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] motion-reduce:transition-none", active ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")} aria-current={active ? "page" : undefined}><Icon className="size-4" aria-hidden="true" /><span>{label}</span></Link>;
      })}
      <details className="group relative">
        <summary aria-label="More navigation" className="flex min-w-14 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-medium text-[var(--color-muted)] transition-colors duration-200 hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] motion-reduce:transition-none">
          <Ellipsis className="size-4" aria-hidden="true" /><span>More</span><ChevronDown className="absolute right-1 top-1 size-3 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 z-30 w-56 rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-lg">
          {navigationItems.filter((item) => ["/news", "/safety", "/khowar", "/profile", "/music", "/team"].includes(item.href)).map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className={cn("flex min-h-11 items-center gap-3 rounded-full px-3 text-sm transition-colors duration-200 motion-reduce:transition-none", pathname === href ? "bg-[var(--color-mist)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-slate)] hover:bg-[var(--background)] hover:text-[var(--color-ink)]")}><Icon className="size-4" aria-hidden="true" />{label}</Link>)}
          <Link href="/#ask-chaythraar" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[var(--color-slate)] hover:bg-[var(--background)]"><Sparkles className="size-4" />Ask CHAYTHRAAR</Link>
        </div>
      </details>
    </nav>
  );
}
