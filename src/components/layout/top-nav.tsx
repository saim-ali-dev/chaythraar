"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Archive, ChevronDown, Ellipsis, Sparkles } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const primaryItems = navigationItems.filter((item) => ["/", "/explore", "/discover", "/news"].includes(item.href));
  const secondaryItems = navigationItems.filter((item) => ["/safety", "/khowar", "/profile", "/map", "/music", "/team"].includes(item.href));
  const secondaryActive = secondaryItems.some((item) => item.href === pathname);

  useEffect(() => {
    let frame = 0;
    const updateCollapsedState = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setCollapsed(window.scrollY > 55);
        frame = 0;
      });
    };

    updateCollapsedState();
    window.addEventListener("scroll", updateCollapsedState, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateCollapsedState);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3">
        <div className={cn("pointer-events-auto flex w-fit max-w-full items-center rounded-full border border-[color-mix(in_srgb,var(--color-line-strong)_68%,transparent)] bg-[color-mix(in_srgb,var(--background)_80%,transparent)] shadow-[0_8px_24px_rgba(28,43,53,0.09),inset_0_1px_0_rgba(255,255,255,0.40)] backdrop-blur-md transition-[padding,gap,background-color,box-shadow] duration-300 ease-out supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--background)_75%,transparent)] motion-reduce:transition-none", collapsed ? "gap-3 px-4 py-1" : "gap-5 px-6 py-2.5")}>
          <Link href="/" className={cn("group flex min-h-11 min-w-28 shrink-0 items-center rounded-full transition-[gap,justify-content] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] motion-reduce:transition-none lg:min-w-0", collapsed ? "justify-center gap-0 lg:w-11 lg:justify-start" : "justify-start gap-3")} aria-label="CHAYTHRAAR home">
            <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white transition-[width,height] duration-300 ease-out motion-reduce:transition-none", collapsed ? "size-9" : "size-10")}><Archive className="size-4" aria-hidden="true" /></span>
            <span aria-hidden={collapsed} className={cn("grid min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none", collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-40 opacity-100")}>
              <span className="whitespace-nowrap text-sm font-bold tracking-[0.12em] text-[var(--color-ink)]">CHAYTHRAAR</span>
              <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">Digital archive · Chitral</span>
            </span>
          </Link>
          <nav className={cn("hidden min-w-0 items-center transition-[gap] duration-300 ease-out motion-reduce:transition-none lg:flex", collapsed ? "gap-1.5" : "gap-2.5")} aria-label="Primary navigation">
            {primaryItems.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined} className={cn("inline-flex min-h-11 shrink-0 items-center justify-center rounded-full text-sm transition-[width,padding,gap,background-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] motion-reduce:transition-none", collapsed ? "w-11 gap-0 px-0" : "gap-2.5 px-3.5", active ? "bg-[var(--color-ink)] font-semibold text-white" : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")} aria-current={active ? "page" : undefined}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span aria-hidden={collapsed} className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none", collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-20 opacity-100")}>{label}</span>
                </Link>
              );
            })}
            <details className="group relative">
              <summary aria-label="More navigation" title={collapsed ? "More navigation" : undefined} className={cn("flex min-h-11 cursor-pointer list-none items-center justify-center rounded-full text-sm transition-[width,padding,gap,background-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] motion-reduce:transition-none", collapsed ? "w-11 gap-0 px-0" : "gap-1 px-3.5", secondaryActive ? "bg-[var(--color-mist)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-slate)] hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)]")}>
                <span aria-hidden={collapsed} className={cn("overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none", collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-10 opacity-100")}>More</span>
                <ChevronDown className={cn("size-4 shrink-0 transition-[opacity,transform] duration-300 ease-out group-open:rotate-180 motion-reduce:transition-none", collapsed && "hidden")} aria-hidden="true" />
                <Ellipsis className={cn("size-5 shrink-0 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none", !collapsed && "hidden")} aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-lg">
                {secondaryItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className={cn("flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors", pathname === href ? "bg-[var(--color-mist)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-slate)] hover:bg-[var(--background)] hover:text-[var(--color-ink)]")}><Icon className="size-4" aria-hidden="true" />{label}</Link>)}
                <Link href="/#ask-chaythraar" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-[var(--color-slate)] transition-colors hover:bg-[var(--background)] hover:text-[var(--color-ink)]"><Sparkles className="size-4" aria-hidden="true" />Ask CHAYTHRAAR</Link>
              </div>
            </details>
          </nav>
        </div>
      </header>
      <div aria-hidden="true" className="h-[72px] shrink-0 lg:h-20" />
    </>
  );
}
