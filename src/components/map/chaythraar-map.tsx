"use client";

import { useEffect, useRef, useState } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, Landmark, Layers3, LoaderCircle, MapPin, Mountain, ShieldAlert, TreePine, Waves, type LucideIcon } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type PlaceRow = Database["public"]["Tables"]["places"]["Row"];
type HazardRow = Database["public"]["Tables"]["hazards"]["Row"];
type MapHazardRow = Pick<HazardRow, "id" | "type" | "title" | "description" | "latitude" | "longitude" | "severity" | "status" | "source_type" | "location_name" | "reported_at" | "issued_at" | "expires_at" | "moderation_status"> & {
  vote_counts?: { correct: number; incorrect: number };
};
type MapLayer = "places" | "heritage" | "safety";

type MapData = {
  places: PlaceRow[];
  hazards: MapHazardRow[];
};

const CHITRAL_CENTER: L.LatLngExpression = [35.85, 71.79];
const CHITRAL_MAP_BOUNDS: L.LatLngBoundsExpression = [[34.7, 70.2], [37.5, 74.0]];
const ACTIVE_LAYERS: Record<MapLayer, boolean> = {
  places: true,
  heritage: true,
  safety: true,
};

const PLACE_MARKER_GROUPS = [
  { key: "heritage", label: "Heritage and cultural sites", icon: Landmark, color: "#8f472d" },
  { key: "park", label: "National parks", icon: TreePine, color: "#35634c" },
  { key: "nature", label: "Natural attractions", icon: Waves, color: "#526572" },
  { key: "landscape", label: "Mountains, passes, and valleys", icon: Mountain, color: "#59633e" },
  { key: "settlement", label: "Towns and cultural regions", icon: Building2, color: "#1c2b35" },
  { key: "other", label: "Other places", icon: MapPin, color: "#9d5437" },
] as const;
const SAFETY_MARKER_GROUP = { key: "safety", label: "Safety events", icon: ShieldAlert, color: "#842f28" } as const;

export function ChaythraarMap() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [layers, setLayers] = useState(ACTIVE_LAYERS);
  const [data, setData] = useState<MapData>({ places: [], hazards: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      center: CHITRAL_CENTER,
      zoom: 9,
      minZoom: 7,
      maxZoom: 16,
      maxBounds: CHITRAL_MAP_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      const [placesResult, hazardsResult] = await Promise.all([
        supabase.from("places").select("id, name, description, latitude, longitude, category, image_url, opening_time, closing_time, source, created_at").not("latitude", "is", null).not("longitude", "is", null),
        supabase.from("hazards").select("id, type, title, description, latitude, longitude, severity, status, source_type, location_name, reported_at, issued_at, expires_at, moderation_status").eq("moderation_status", "approved").not("latitude", "is", null).not("longitude", "is", null),
      ]);

      if (cancelled) return;
      if (placesResult.error || hazardsResult.error) {
        setError(placesResult.error?.message ?? hazardsResult.error?.message ?? "The map data could not be loaded.");
        setLoading(false);
        return;
      }

      const hazards = hazardsResult.data ?? [];
      const communityReportIds = hazards.filter((hazard) => hazard.source_type === "community").map((hazard) => hazard.id);
      const voteCounts: Record<string, { correct: number; incorrect: number }> = {};
      if (communityReportIds.length) {
        try {
          const voteCountChunks = await Promise.all(
            Array.from({ length: Math.ceil(communityReportIds.length / 100) }, async (_, chunkIndex) => {
              const reportIds = communityReportIds.slice(chunkIndex * 100, chunkIndex * 100 + 100);
              const response = await fetch(`/api/safety/votes?reportIds=${reportIds.join(",")}`, { cache: "no-store" });
              if (!response.ok) return {};
              const body = await response.json();
              return body.countsByReportId as Record<string, { correct: number; incorrect: number }>;
            }),
          );
          for (const chunk of voteCountChunks) {
            Object.assign(voteCounts, chunk);
          }
        } catch {
        }
      }

      if (cancelled) return;
      setData({
        places: placesResult.data ?? [],
        hazards: hazards.map((hazard) => ({ ...hazard, vote_counts: voteCounts[hazard.id] })),
      });
      setLoading(false);
    }

    void loadMapData().catch((loadError) => {
      if (cancelled) return;
      setError(loadError instanceof Error ? loadError.message : "The map data could not be loaded.");
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    if (!markerLayer) return;
    markerLayer.clearLayers();

    const addMarker = (latitude: number | null, longitude: number | null, title: string, icon: L.DivIcon, popup: HTMLElement) => {
      if (latitude === null || longitude === null) return;
      const marker = L.marker([latitude, longitude], { icon, title, alt: title, keyboard: true, riseOnHover: true });
      marker.bindPopup(popup, { className: "chaythraar-map-popup" });
      marker.on("popupopen", () => marker.getElement()?.classList.add("is-selected"));
      marker.on("popupclose", () => marker.getElement()?.classList.remove("is-selected"));
      marker.addTo(markerLayer);
    };

    if (layers.places) {
      data.places.filter((place) => !isHeritage(place.category)).forEach((place) => {
        const markerGroup = getPlaceMarkerGroup(place.category);
        addMarker(place.latitude, place.longitude, `${place.category}: ${place.name}`, createPlaceIcon(markerGroup), createPlacePopup(place));
      });
    }

    if (layers.heritage) {
      data.places.filter((place) => isHeritage(place.category)).forEach((place) => {
        const markerGroup = getPlaceMarkerGroup(place.category);
        addMarker(place.latitude, place.longitude, `${place.category}: ${place.name}`, createPlaceIcon(markerGroup), createPlacePopup(place));
      });
    }

    if (layers.safety) {
      data.hazards.forEach((hazard) => {
        const title = `${SAFETY_MARKER_GROUP.label}: ${hazard.title ?? hazard.type}`;
        addMarker(hazard.latitude, hazard.longitude, title, createSafetyIcon(hazard.source_type === "community"), createSafetyPopup(hazard));
      });
    }
  }, [data, layers]);

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-white">
      <div className="flex flex-col gap-3 border-b border-[var(--color-line)] bg-[var(--color-sand)]/60 p-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Layers3 className="size-4 text-[var(--color-copper-deep)]" /><span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">Map layers</span></div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle map layers">
            {(["places", "heritage", "safety"] as MapLayer[]).map((layer) => <LayerToggle key={layer} layer={layer} checked={layers[layer]} onChange={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))} />)}
          </div>
        </div>
        <details className="group/map-legend">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-md border border-[var(--color-line)] bg-white px-3 text-xs font-semibold text-[var(--color-slate)] hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">Map key</summary>
          <div className="mt-2 w-full rounded-md border border-[var(--color-line)] bg-white p-3 sm:max-w-2xl">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PLACE_MARKER_GROUPS.map((group) => <LegendItem key={group.key} icon={group.icon} label={group.label} color={group.color} />)}
              <LegendItem icon={SAFETY_MARKER_GROUP.icon} label={SAFETY_MARKER_GROUP.label} color={SAFETY_MARKER_GROUP.color} />
            </ul>
          </div>
        </details>
      </div>
      <div className="relative">
        <div ref={mapElementRef} className="h-[min(64vh,680px)] min-h-[380px] w-full sm:min-h-[520px]" />
        {loading && <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[rgba(255,252,247,0.72)]"><div className="flex items-center gap-3 bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white" role="status"><LoaderCircle className="size-4 animate-spin" />Loading map data</div></div>}
      </div>
      {error && <div className="border-t border-[var(--color-danger-deep)]/30 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-slate)]" role="alert"><p className="font-semibold text-[var(--color-danger-deep)]">Map data unavailable</p><p className="mt-1">{error}</p></div>}
      {!loading && !error && data.places.length === 0 && data.hazards.length === 0 && <div className="border-t border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-slate)]" role="status"><p className="font-semibold text-[var(--color-ink)]">No mapped records are available.</p><p className="mt-1">Map features will appear when location-enabled place or safety records are available.</p></div>}
    </div>
  );
}

function LayerToggle({ layer, checked, onChange }: { layer: MapLayer; checked: boolean; onChange: () => void }) {
  const labels: Record<MapLayer, string> = { places: "Places", heritage: "Heritage", safety: "Safety" };
  const icons: Record<MapLayer, typeof MapPin> = { places: MapPin, heritage: TreePine, safety: ShieldAlert };
  const Icon = icons[layer];
  return <button type="button" aria-pressed={checked} onClick={onChange} className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] ${checked ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] bg-white text-[var(--color-slate)] hover:border-[var(--color-line-strong)]"}`}><Icon className="size-3.5" />{labels[layer]}</button>;
}

function LegendItem({ icon: Icon, label, color }: { icon: LucideIcon; label: string; color: string }) {
  return <li className="flex min-h-9 items-center gap-2 text-xs text-[var(--color-slate)]"><Icon className="size-4 shrink-0" style={{ color }} aria-hidden="true" /><span>{label}</span></li>;
}

function getPlaceMarkerGroup(category: string) {
  const normalized = category.toLowerCase();
  if (/heritage|historic|cultural site|museum|religious|mosque/.test(normalized)) return PLACE_MARKER_GROUPS[0];
  if (/national park/.test(normalized)) return PLACE_MARKER_GROUPS[1];
  if (/natural attraction|lake|river/.test(normalized)) return PLACE_MARKER_GROUPS[2];
  if (/town|cultural region/.test(normalized)) return PLACE_MARKER_GROUPS[4];
  if (/mountain|pass|valley/.test(normalized)) return PLACE_MARKER_GROUPS[3];
  return PLACE_MARKER_GROUPS[5];
}

function createPlaceIcon(group: (typeof PLACE_MARKER_GROUPS)[number]) {
  const Icon = group.icon;
  const svg = renderToStaticMarkup(createElement(Icon, { size: 16, strokeWidth: 2.2, "aria-hidden": true }));
  return L.divIcon({
    className: "chaythraar-marker-icon",
    html: `<span class="chaythraar-place-marker chaythraar-place-marker--${group.key}" aria-hidden="true">${svg}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -26],
  });
}

function createSafetyIcon(isCommunityReport: boolean) {
  const svg = renderToStaticMarkup(createElement(SAFETY_MARKER_GROUP.icon, { size: 16, strokeWidth: 2.2, "aria-hidden": true }));
  const markerClass = isCommunityReport ? "chaythraar-place-marker--safety-community" : "chaythraar-place-marker--safety";
  return L.divIcon({
    className: "chaythraar-marker-icon",
    html: `<span class="chaythraar-place-marker ${markerClass}" aria-hidden="true">${svg}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -26],
  });
}

function isHeritage(category: string): boolean {
  return /heritage|historic|cultural site|museum|religious|mosque/i.test(category);
}

function createPlacePopup(place: PlaceRow): HTMLElement {
  const content = document.createElement("div");
  appendText(content, "div", "map-popup-kicker", place.category);
  appendText(content, "h3", "map-popup-title", place.name);
  appendText(content, "p", "map-popup-description", place.description ?? "No description available.");
  return content;
}

function createSafetyPopup(hazard: MapHazardRow): HTMLElement {
  const content = document.createElement("div");
  const isCommunityReport = hazard.source_type === "community";
  appendText(content, "div", "map-popup-kicker", isCommunityReport ? "Community safety report" : hazard.source_type === "official" ? "Official advisory" : hazard.source_type === "news" ? "News report" : "Safety event");
  appendText(content, "h3", "map-popup-title", hazard.title ?? hazard.type);
  appendText(content, "p", "map-popup-description", hazard.description);
  if (isCommunityReport) appendText(content, "p", "map-popup-meta", "Moderation: Admin-approved");
  appendText(content, "p", "map-popup-meta", `Severity: ${hazard.severity} · Status: ${hazard.status}`);
  if (hazard.location_name) appendText(content, "p", "map-popup-meta", `Location: ${hazard.location_name}`);
  const observedAt = hazard.issued_at ?? hazard.reported_at;
  if (observedAt) appendText(content, "p", "map-popup-meta", `Observed: ${formatMapDate(observedAt)}`);
  if (isCommunityReport && hazard.vote_counts) {
    appendText(content, "p", "map-popup-meta", `Community feedback: ${hazard.vote_counts.correct} Correct · ${hazard.vote_counts.incorrect} Incorrect`);
  }
  return content;
}

function formatMapDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function appendText(parent: HTMLElement, tag: string, className: string, value: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  parent.appendChild(element);
}
