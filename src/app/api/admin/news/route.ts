import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";
import { ingestAllNewsSources } from "@/lib/news/ingest";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const { data, count, error } = await supabase.from("news")
    .select("id,title,summary,headline,summary_short,original_title,original_language,source,source_url,image_url,published_at,category,created_at", { count: "exact" })
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Could not load news records." }, { status: 503 });
  return NextResponse.json({ records: data ?? [], count: count ?? 0 });
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "refresh") return NextResponse.json({ error: "Unsupported news action." }, { status: 400 });

  try {
    const report = await ingestAllNewsSources();
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "The news refresh could not complete." }, { status: 503 });
  }
}