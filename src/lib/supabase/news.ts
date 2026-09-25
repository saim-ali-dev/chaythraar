import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { NewsEntry } from "@/types/content";

export async function getNewsEntries(): Promise<NewsEntry[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("news")
      .select("id, title, summary, headline, summary_short, original_title, original_language, source, source_url, image_url, published_at, category, created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Unable to load news entries.", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("Unable to connect to the news data source.", error);
    return [];
  }
}
