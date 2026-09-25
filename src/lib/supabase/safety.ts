import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { SafetyEvent } from "@/types/safety";

type HazardRow = Database["public"]["Tables"]["hazards"]["Row"];

export type SafetyReadResult = {
  events: SafetyEvent[];
  error: string | null;
};

export async function getSafetyEvents(): Promise<SafetyReadResult> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("hazards")
      .select("id, type, title, description, latitude, longitude, severity, status, source, source_name, source_url, source_type, location_name, reported_at, issued_at, expires_at, created_at")
      .order("reported_at", { ascending: false });

    if (error) {
      console.error("Unable to load safety events.", error);
      return { events: [], error: "Safety events could not be loaded from the public data source." };
    }

    return { events: (data ?? []).map(toSafetyEvent), error: null };
  } catch (error) {
    console.error("Unable to connect to the safety data source.", error);
    return { events: [], error: "Safety events could not be loaded from the public data source." };
  }
}

function toSafetyEvent(row: Pick<HazardRow, "id" | "type" | "title" | "description" | "latitude" | "longitude" | "severity" | "status" | "source" | "source_name" | "source_url" | "source_type" | "location_name" | "reported_at" | "issued_at" | "expires_at" | "created_at">): SafetyEvent {
  return {
    id: row.id,
    event_type: row.type,
    title: row.title ?? row.type,
    description: row.description,
    severity: row.severity,
    status: row.status,
    source_name: row.source_name ?? row.source,
    source_url: row.source_url,
    source_type: row.source_type,
    latitude: row.latitude,
    longitude: row.longitude,
    location_name: row.location_name,
    issued_at: row.issued_at ?? row.reported_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}
