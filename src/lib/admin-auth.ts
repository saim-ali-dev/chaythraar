import "server-only";
import { isAdminEmailAllowed, parseAdminEmailAllowlist } from "@/lib/admin-access";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export function isAdminAuthConfigured() {
  return parseAdminEmailAllowlist().size > 0
    && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getAdminUser() {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email_confirmed_at || !isAdminEmailAllowed(data.user.email)) return null;
    return data.user;
  } catch {
    return null;
  }
}