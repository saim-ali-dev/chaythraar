import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PlaceRow = Database["public"]["Tables"]["places"]["Row"];

export async function getPlaces(): Promise<{ places: PlaceRow[]; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("places")
      .select("id, name, description, latitude, longitude, category, image_url, opening_time, closing_time, source, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Unable to load places.", error);
      return { places: [], error: "Places could not be loaded from the public data source." };
    }

    return { places: data ?? [], error: null };
  } catch (error) {
    console.error("Unable to connect to the places data source.", error);
    return { places: [], error: "Places could not be loaded from the public data source." };
  }
}

export async function getPlaceById(id: string): Promise<{ place: PlaceRow | null; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("places")
      .select("id, name, description, latitude, longitude, category, image_url, opening_time, closing_time, source, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Unable to load the place.", error);
      return { place: null, error: "This place could not be loaded from the public data source." };
    }

    return { place: data, error: null };
  } catch (error) {
    console.error("Unable to connect to the place data source.", error);
    return { place: null, error: "This place could not be loaded from the public data source." };
  }
}

export type { PlaceRow };
