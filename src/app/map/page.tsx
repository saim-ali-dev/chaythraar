"use client";

import dynamic from "next/dynamic";
import { Compass, MapPinned } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ChitralWeather } from "@/components/map/chitral-weather";

const ChaythraarMap = dynamic(() => import("@/components/map/chaythraar-map").then((module) => module.ChaythraarMap), {
  ssr: false,
  loading: () => <div className="flex h-[min(72vh,680px)] min-h-[520px] items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] text-sm text-[var(--color-muted)]">Loading map</div>,
});

export default function MapPage() {
  return <AppShell><main className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-16"><section className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><Badge tone="copper">Map · Chitral</Badge><h1 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-ink)] sm:text-6xl">Orient yourself in place.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-slate)]">Explore verified places, heritage, and available safety records across Chitral.</p></div><div className="hidden items-center gap-3 text-sm text-[var(--color-muted)] sm:flex"><Compass className="size-5 text-[var(--color-copper)]" /><span>OpenStreetMap · centered on Chitral</span></div></section><ChitralWeather /><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]"><MapPinned className="size-4 text-[var(--color-copper)]" />Live map data</div><ChaythraarMap /></main></AppShell>;
}
