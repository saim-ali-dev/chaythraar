import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  nextStep: string;
};

export function PlaceholderPage({ eyebrow, title, description, icon: Icon, nextStep }: PlaceholderPageProps) {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <section className="grid w-full items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl">
            <Badge tone="copper">{eyebrow} · MVP preview</Badge>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-ink)] sm:text-7xl">{title}</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-slate)] sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button disabled>Coming in the MVP</Button><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[var(--color-slate)] transition-colors hover:text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]"><ArrowLeft className="size-4" />Back home</Link></div>
          </div>
          <Card className="relative min-h-72 overflow-hidden bg-[var(--color-sand)] p-7 sm:min-h-96 sm:p-9"><div className="absolute -right-16 -top-16 size-52 rounded-full border border-[var(--color-copper)]/15" /><div className="absolute -bottom-24 -left-8 size-72 rounded-full border border-[var(--color-copper)]/15" /><div className="relative flex min-h-56 flex-col justify-between"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[var(--color-copper)] shadow-sm"><Icon className="size-6" /></span><span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">Soon</span></div><div><p className="max-w-sm text-2xl font-semibold leading-8 tracking-[-0.03em] text-[var(--color-ink)]">{nextStep}</p><div className="mt-6 flex items-center gap-2 text-sm font-medium text-[var(--color-copper-deep)]">A focused space for Chitral <ArrowUpRight className="size-4" /></div></div></div></Card>
        </section>
      </main>
    </AppShell>
  );
}
