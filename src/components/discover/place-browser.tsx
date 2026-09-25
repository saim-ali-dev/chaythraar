"use client";

import Link from "next/link";
import { Search, Clock3, MapPin, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlaceRow } from "@/lib/supabase/places";

export function PlaceBrowser({ places }: { places: PlaceRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(places.map((place) => place.category))).sort()], [places]);
  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return places.filter((place) => {
      const matchesCategory = category === "All" || place.category === category;
      const matchesQuery = !normalizedQuery || `${place.name} ${place.description ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, places, query]);

  return <div><div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)] p-4 sm:p-5 lg:flex-row lg:items-center"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" /><span className="sr-only">Search places</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places by name or description" className="min-h-11 w-full rounded-xl border border-[var(--color-line)] bg-white pl-11 pr-4 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-copper)]" /></label><div className="flex min-w-0 gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)] ${category === item ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-slate)] hover:text-[var(--color-copper-deep)]"}`}>{item}</button>)}</div></div><div className="mt-8 flex items-center justify-between"><p className="text-sm text-[var(--color-muted)]">{filteredPlaces.length} {filteredPlaces.length === 1 ? "place" : "places"}</p><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">Verified place records</p></div>{filteredPlaces.length === 0 ? <Card className="mt-4 bg-[var(--color-sand)] p-8"><h2 className="text-xl font-semibold text-[var(--color-ink)]">No places match this view.</h2><p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">Try another search or category. No placeholder places are shown.</p></Card> : <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}</div>}</div>;
}

function PlaceCard({ place }: { place: PlaceRow }) {
  return <Card className="flex h-full flex-col overflow-hidden"><div className="relative h-44 bg-[var(--color-mist)]">{place.image_url ? <div role="img" aria-label={place.name} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${place.image_url}")` }} /> : <div className="flex h-full items-center justify-center text-[var(--color-copper)]"><MapPin className="size-8" /></div>}<Badge tone="copper" className="absolute left-4 top-4">{place.category}</Badge></div><div className="flex flex-1 flex-col p-5"><h2 className="text-xl font-semibold leading-7 tracking-[-0.025em] text-[var(--color-ink)]">{place.name}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-slate)]">{place.description ?? "No description available."}</p>{(place.opening_time || place.closing_time) && <p className="mt-4 inline-flex items-center gap-2 text-xs text-[var(--color-muted)]"><Clock3 className="size-3.5" />{formatHours(place.opening_time, place.closing_time)}</p>}<Link href={`/discover/${place.id}`} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[var(--color-copper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper)]">View place <ArrowUpRight className="size-4" /></Link></div></Card>;
}

function formatHours(opening: string | null, closing: string | null): string {
  if (opening && closing) return `${opening} - ${closing}`;
  return opening ? `Opens ${opening}` : `Closes ${closing}`;
}
