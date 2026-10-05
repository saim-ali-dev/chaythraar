"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Satellite } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Sentinel2Result } from "@/lib/satellite/sentinel2";

const LOADING_RESULT: Sentinel2Result = { scene: null, error: null };

export function SatelliteMonitoringPanel() {
  const [result, setResult] = useState<Sentinel2Result>(LOADING_RESULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadScene() {
      try {
        const response = await fetch("/api/satellite/sentinel-2", { signal: controller.signal });
        if (!response.ok) throw new Error(`Satellite service returned HTTP ${response.status}.`);
        const data = await response.json() as Sentinel2Result;
        if (!data || (data.scene === null && typeof data.error !== "string")) throw new Error("Satellite service response is malformed.");
        setResult(data);
      } catch {
        if (!controller.signal.aborted) setResult({ scene: null, error: "Latest Sentinel-2 imagery is temporarily unavailable." });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadScene();
    return () => controller.abort();
  }, []);

  return (
    <Card className="mb-8 min-w-0 p-4 sm:p-5" aria-labelledby="satellite-monitoring-heading">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]"><Satellite className="size-4" />Satellite monitoring</p>
          <h2 id="satellite-monitoring-heading" className="mt-2 text-lg font-semibold text-[var(--color-ink)]">Chitral · Sentinel-2 L2A</h2>
        </div>
        {result.scene && <a href={result.scene.viewerUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open official Copernicus Browser to view Sentinel-2 imagery, scene ${result.scene.id}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-[var(--color-line-strong)] px-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-sand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] sm:self-auto">View satellite imagery <ExternalLink className="size-4" /></a>}
      </div>

      {loading ? <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">Checking recent imagery…</p> : result.error ? <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">Satellite imagery is temporarily unavailable. Map records remain available.</p> : result.scene ? <dl className="mt-4 grid min-w-0 gap-3 border-t border-[var(--color-line)] pt-3 sm:grid-cols-3">
        <div className="min-w-0"><dt className="text-xs text-[var(--color-muted)]">Latest imagery</dt><dd className="mt-1 text-sm font-semibold text-[var(--color-ink)]"><time dateTime={result.scene.acquisitionDate}>{formatDate(result.scene.acquisitionDate)}</time></dd></div>
        {result.scene.sceneCloudCover !== null && <div className="min-w-0"><dt className="text-xs text-[var(--color-muted)]">Scene cloud cover</dt><dd className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{formatCloudCover(result.scene.sceneCloudCover)}</dd></div>}
        <div className="min-w-0"><dt className="text-xs text-[var(--color-muted)]">Scene ID</dt><dd className="mt-1 break-all font-mono text-xs text-[var(--color-slate)]">{result.scene.id}</dd></div>
      </dl> : <p className="mt-3 text-sm text-[var(--color-muted)]" role="status">No recent Sentinel-2 scenes intersecting Chitral were found.</p>}

      <p className="mt-3 text-xs text-[var(--color-muted)]">Source: Copernicus Data Space · scene metadata only, not a safety alert.</p>
    </Card>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function formatCloudCover(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}