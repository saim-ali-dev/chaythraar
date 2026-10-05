import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SiteMedia = Database["public"]["Tables"]["site_media"]["Row"];

export async function getSiteMedia() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("site_media")
      .select("id,media_key,title,category,image_url,image_source,image_credit,image_license,created_at");
    if (error) return [];
    return data as SiteMedia[];
  } catch {
    return [];
  }
}

export async function getSiteMediaByKey(mediaKey: string) {
  const media = await getSiteMedia();
  return media.find((record) => record.media_key === mediaKey) ?? null;
}
