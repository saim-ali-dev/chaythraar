import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

// This server client intentionally has no cookie or authentication handling yet.
export function createServerSupabaseClient(): SupabaseClient<Database> {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient<Database>(url, publishableKey);
}
