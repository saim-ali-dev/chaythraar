import { Newspaper } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function NewsLoading() {
  return <AppShell><main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-20"><section className="grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]"><div className="animate-pulse"><div className="h-6 w-32 rounded-full bg-[var(--color-mist)]" /><div className="mt-6 h-24 max-w-xl rounded-2xl bg-[var(--color-mist)]" /><div className="mt-6 h-16 max-w-lg rounded-2xl bg-[var(--color-mist)]" /></div><Card className="flex min-h-72 items-center justify-center bg-[var(--color-sand)] sm:min-h-96"><Newspaper className="size-8 animate-pulse text-[var(--color-copper)]" /></Card></section><section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading news"><Card className="h-72 animate-pulse" /><Card className="h-72 animate-pulse" /><Card className="h-72 animate-pulse" /></section></main></AppShell>;
}
