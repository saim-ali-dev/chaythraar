import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopNav } from "@/components/layout/top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
        <Link href="/" className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]" aria-label="CHAYTHRAAR home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--color-ink)] text-white transition-transform group-hover:-rotate-6"><Sparkles className="size-4" /></span>
          <span><span className="block text-sm font-bold tracking-[0.12em] text-[var(--color-ink)]">CHAYTHRAAR</span><span className="block text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">Chitral, connected</span></span>
        </Link>
        <TopNav />
        <div className="hidden items-center gap-3 lg:flex"><span className="size-2 rounded-full bg-[var(--color-green-deep)]" /><span className="text-xs font-medium text-[var(--color-muted)]">Demo mode</span></div>
      </header>
      {children}
      <MobileNav />
    </div>
  );
}
