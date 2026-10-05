"use client";

import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SatelliteMonitoringPanel } from "@/components/map/satellite-monitoring-panel";
import { ChitralWeather } from "@/components/map/chitral-weather";

const ChaythraarMap = dynamic(() => import("@/components/map/chaythraar-map").then((module) => module.ChaythraarMap), {
  ssr: false,
  loading: () => <div className="flex h-[min(64vh,680px)] min-h-[380px] items-center justify-center border border-[var(--color-line)] bg-[var(--color-sand)] text-sm text-[var(--color-muted)] sm:min-h-[520px]">Loading map</div>,
});

export default function MapPage() {
  return <AppShell hideCredit><main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14"><PageHeader variant="operational" eyebrow="Map · Chitral" title="Places and safety records" description="View mapped place and event records alongside the available five-day weather forecast." /><ChitralWeather /><SatelliteMonitoringPanel /><div className="mb-3 flex items-center gap-2 border-b border-[var(--color-line-strong)] pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]"><MapPinned className="size-4 text-[var(--color-copper-deep)]" />Map records</div><ChaythraarMap /></main></AppShell>;
}
