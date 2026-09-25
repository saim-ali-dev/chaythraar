import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function ExploreLoading() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="animate-pulse">
            <div className="h-6 w-36 rounded-full bg-[var(--color-mist)]" />
            <div className="mt-6 h-24 max-w-xl rounded-2xl bg-[var(--color-mist)]" />
            <div className="mt-6 h-16 max-w-lg rounded-2xl bg-[var(--color-mist)]" />
          </div>
          <Card className="flex min-h-72 items-center justify-center bg-[var(--color-sand)] sm:min-h-96"><BookOpen className="size-8 animate-pulse text-[var(--color-copper)]" /></Card>
        </section>
        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading encyclopedia entries">
          {Array.from({ length: 3 }, (_, index) => <Card key={index} className="animate-pulse p-6"><div className="h-3 w-24 rounded bg-[var(--color-mist)]" /><div className="mt-5 h-6 w-3/4 rounded bg-[var(--color-mist)]" /><div className="mt-4 h-16 rounded bg-[var(--color-mist)]" /></Card>)}
        </section>
      </main>
    </AppShell>
  );
}
