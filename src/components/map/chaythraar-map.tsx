"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers3, LoaderCircle, MapPin, ShieldAlert, TreePine } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type PlaceRow = Database["public"]["Tables"]["places"]["Row"];
type HazardRow = Database["public"]["Tables"]["hazards"]["Row"];
type MapLayer = "places" | "heritage" | "safety";

type MapData = {
  places: PlaceRow[];
  hazards: HazardRow[];
};

const CHITRAL_CENTER: L.LatLngExpression = [35.85, 71.79];
const ACTIVE_LAYERS: Record<MapLayer, boolean> = {
  places: true,
  heritage: true,
  safety: true,
};

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
      zoom: 10,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
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
        supabase.from("hazards").select("id, type, title, description, latitude, longitude, severity, status, source, source_name, source_url, source_type, location_name, reported_at, issued_at, expires_at, created_at").not("latitude", "is", null).not("longitude", "is", null),
      ]);

      if (cancelled) return;
      if (placesResult.error || hazardsResult.error) {
        setError(placesResult.error?.message ?? hazardsResult.error?.message ?? "The map data could not be loaded.");
        setLoading(false);
        return;
      }

      setData({ places: placesResult.data ?? [], hazards: hazardsResult.data ?? [] });
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

    const addMarker = (latitude: number | null, longitude: number | null, color: string, popup: HTMLElement) => {
      if (latitude === null || longitude === null) return;
      L.circleMarker([latitude, longitude], {
        radius: 8,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.8,
      }).bindPopup(popup, { className: "chaythraar-map-popup" }).addTo(markerLayer);
    };

    if (layers.places) {
      data.places.filter((place) => !isHeritage(place.category)).forEach((place) => {
        addMarker(place.latitude, place.longitude, "#bd6b45", createPlacePopup(place));
      });
    }

    if (layers.heritage) {
      data.places.filter((place) => isHeritage(place.category)).forEach((place) => {
        addMarker(place.latitude, place.longitude, "#315c52", createPlacePopup(place));
      });
    }

    if (layers.safety) {
      data.hazards.forEach((hazard) => {
        addMarker(hazard.latitude, hazard.longitude, "#9f3d31", createSafetyPopup(hazard));
      });
    }
  }, [data, layers]);

  return <div className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] shadow-[0_24px_80px_rgba(36,48,45,0.12)]"><div className="absolute left-4 top-4 z-[1000] w-[calc(100%-2rem)] max-w-xs rounded-xl border border-white/70 bg-[rgba(255,252,247,0.94)] p-3 shadow-lg backdrop-blur sm:left-6 sm:top-6 sm:w-auto"><div className="flex items-center gap-2"><Layers3 className="size-4 text-[var(--color-copper)]" /><span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">Map layers</span></div><div className="mt-3 flex flex-wrap gap-2">{(["places", "heritage", "safety"] as MapLayer[]).map((layer) => <LayerToggle key={layer} layer={layer} checked={layers[layer]} onChange={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))} />)}</div></div><div ref={mapElementRef} className="h-[min(72vh,680px)] min-h-[520px] w-full" />{loading && <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[rgba(255,252,247,0.72)] backdrop-blur-sm"><div className="flex items-center gap-3 rounded-full bg-[var(--color-ink)] px-4 py-3 text-sm font-semibold text-white"><LoaderCircle className="size-4 animate-spin" />Loading map data</div></div>}{error && <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-[var(--color-copper)]/30 bg-[rgba(255,252,247,0.96)] p-4 text-sm text-[var(--color-slate)] shadow-lg sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md"><p className="font-semibold text-[var(--color-ink)]">Map data unavailable</p><p className="mt-1">{error}</p></div>}{!loading && !error && data.places.length === 0 && data.hazards.length === 0 && <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-xl border border-[var(--color-line)] bg-[rgba(255,252,247,0.96)] p-4 text-sm text-[var(--color-slate)] shadow-lg sm:bottom-6 sm:left-6 sm:right-auto"><p className="font-semibold text-[var(--color-ink)]">No mapped records yet</p><p className="mt-1">Verified place and safety records will appear here as they become available.</p></div>}</div>;
}

function LayerToggle({ layer, checked, onChange }: { layer: MapLayer; checked: boolean; onChange: () => void }) {
  const labels: Record<MapLayer, string> = { places: "Places", heritage: "Heritage", safety: "Safety" };
  const icons: Record<MapLayer, typeof MapPin> = { places: MapPin, heritage: TreePine, safety: ShieldAlert };
  const Icon = icons[layer];
  return <button type="button" aria-pressed={checked} onClick={onChange} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors ${checked ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] bg-white/70 text-[var(--color-muted)]"}`}><Icon className="size-3.5" />{labels[layer]}</button>;
}

function isHeritage(category: string): boolean {
  return /heritage|historic/i.test(category);
}

function createPlacePopup(place: PlaceRow): HTMLElement {
  const content = document.createElement("div");
  appendText(content, "div", "map-popup-kicker", place.category);
  appendText(content, "h3", "map-popup-title", place.name);
  appendText(content, "p", "map-popup-description", place.description ?? "No description available.");
  return content;
}

function createSafetyPopup(hazard: HazardRow): HTMLElement {
  const content = document.createElement("div");
  appendText(content, "div", "map-popup-kicker", hazard.source_type === "official" ? "Official advisory" : hazard.source_type === "news" ? "News report" : "Safety event");
  appendText(content, "h3", "map-popup-title", hazard.title ?? hazard.type);
  appendText(content, "p", "map-popup-description", hazard.description);
  return content;
}

function appendText(parent: HTMLElement, tag: string, className: string, value: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  parent.appendChild(element);
}
