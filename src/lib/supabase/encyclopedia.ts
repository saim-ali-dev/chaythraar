import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EncyclopediaEntry } from "@/types/content";

export async function getEncyclopediaEntries(): Promise<EncyclopediaEntry[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("encyclopedia")
      .select("id, title, category, content, image_url, source, source_url, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to load encyclopedia entries.", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("Unable to connect to the encyclopedia data source.", error);
    return [];
  }
}

export async function getEncyclopediaEntryById(id: string): Promise<EncyclopediaEntry | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("encyclopedia")
      .select("id, title, category, content, image_url, source, source_url, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Unable to load the encyclopedia entry.", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unable to connect to the encyclopedia data source.", error);
    return null;
  }
}
