import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function PATCH(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || body.password.length < 12 || body.password.length > 1024) {
    return NextResponse.json({ error: "Password must be between 12 and 1024 characters." }, { status: 400 });
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.auth.updateUser({ password: body.password });
  if (error) return NextResponse.json({ error: "Could not update the account password." }, { status: 400 });
  return NextResponse.json({ updated: true });
}