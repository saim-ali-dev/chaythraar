import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNewsActiveWindowStart, NEWS_ACTIVE_LIMIT } from "@/lib/news/lifecycle";
import type { NewsEntry } from "@/types/content";

export async function getNewsEntries(): Promise<NewsEntry[]> {
  try {
    const supabase = createServerSupabaseClient();
    const activeWindowStart = getNewsActiveWindowStart().toISOString();
    const { data, error } = await supabase
      .from("news")
      .select("id, title, summary, headline, summary_short, original_title, original_language, source, source_url, image_url, published_at, category, created_at")
      .gte("published_at", activeWindowStart)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(NEWS_ACTIVE_LIMIT);

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
