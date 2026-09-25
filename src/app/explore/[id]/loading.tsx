import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function EncyclopediaArticleLoading() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-5xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        <div className="h-5 w-40 animate-pulse rounded bg-[var(--color-mist)]" />
        <section className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_0.72fr]"><div className="animate-pulse"><div className="h-6 w-36 rounded-full bg-[var(--color-mist)]" /><div className="mt-6 h-24 max-w-xl rounded-2xl bg-[var(--color-mist)]" /></div><Card className="flex min-h-56 items-center justify-center bg-[var(--color-ink)]"><BookOpen className="size-10 animate-pulse text-[var(--color-copper-soft)]" /></Card></section>
        <Card className="mt-10 min-h-72 animate-pulse p-8"><div className="h-5 w-full rounded bg-[var(--color-mist)]" /><div className="mt-4 h-5 w-5/6 rounded bg-[var(--color-mist)]" /><div className="mt-4 h-5 w-3/4 rounded bg-[var(--color-mist)]" /></Card>
      </main>
    </AppShell>
  );
}
