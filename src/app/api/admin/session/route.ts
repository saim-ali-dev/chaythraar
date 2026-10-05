import { NextRequest, NextResponse } from "next/server";
import { isAdminEmailAllowed } from "@/lib/admin-access";
import { getAdminUser, isAdminAuthConfigured } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function GET() {
  const user = await getAdminUser();
  return NextResponse.json({
    configured: isAdminAuthConfigured(),
    authorized: Boolean(user),
    email: user?.email ?? null,
  });
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!isAdminAuthConfigured()) return NextResponse.json({ error: "Admin access is not configured on this server." }, { status: 503 });

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string"
    || body.email.length > 254 || body.password.length > 1024) {
    return NextResponse.json({ error: "Enter a valid administrator email and password." }, { status: 400 });
  }

  if (!isAdminEmailAllowed(body.email)) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email.trim(),
    password: body.password,
  });
  if (error || !data.user?.email_confirmed_at || !isAdminEmailAllowed(data.user.email)) {
    if (data.user) await supabase.auth.signOut();
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  return NextResponse.json({ authorized: true, email: data.user.email });
}

export async function DELETE(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ authorized: false });
}
