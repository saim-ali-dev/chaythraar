import Link from "next/link";
import { Archive, BriefcaseBusiness, Camera, CodeXml } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OpeningSequence } from "@/components/layout/opening-sequence";
import { TopNav } from "@/components/layout/top-nav";

export function AppShell({ children, hideCredit = false }: { children: React.ReactNode; hideCredit?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 border-b border-[var(--color-line)] px-5 py-4 sm:px-8 lg:px-10 lg:py-5">
        <Link href="/" className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]" aria-label="CHAYTHRAAR home">
          <span className="flex size-9 items-center justify-center rounded-md bg-[var(--color-ink)] text-white"><Archive className="size-4" /></span>
          <span><span className="block text-sm font-bold tracking-[0.12em] text-[var(--color-ink)]">CHAYTHRAAR</span><span className="block text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">Digital archive · Chitral</span></span>
        </Link>
        <TopNav />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      {!hideCredit && <footer className="mt-auto border-t border-[var(--color-line)] px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 sm:px-8 lg:px-10 lg:pb-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-muted)]">Developed by <span className="font-semibold text-[var(--color-slate)]">Saim Ali</span> <span aria-hidden="true">—</span> The GOTEI</p>
          <nav className="-ml-2 flex items-center gap-1" aria-label="Saim Ali social profiles">
            <a href="https://github.com/saim-ali-dev" target="_blank" rel="noopener noreferrer" aria-label="Saim Ali on GitHub" className="inline-flex size-11 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><CodeXml className="size-4" aria-hidden="true" /></a>
            <a href="https://www.linkedin.com/in/saim-aliii" target="_blank" rel="noopener noreferrer" aria-label="Saim Ali on LinkedIn" className="inline-flex size-11 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><BriefcaseBusiness className="size-4" aria-hidden="true" /></a>
            <a href="https://www.instagram.com/alt.saim/" target="_blank" rel="noopener noreferrer" aria-label="Saim Ali on Instagram" className="inline-flex size-11 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-mist)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><Camera className="size-4" aria-hidden="true" /></a>
          </nav>
        </div>
      </footer>}
      <MobileNav />
      <OpeningSequence />
    </div>
  );
}
