import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { isAdminContentEntity, validateAdminContentRecord } from "@/lib/admin-content";
import { hasSameOrigin } from "@/lib/http-security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const entity = request.nextUrl.searchParams.get("entity");
  if (!isAdminContentEntity(entity)) return NextResponse.json({ error: "Unsupported content entity." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const page = Math.max(0, Math.min(1000, Number(request.nextUrl.searchParams.get("page") ?? 0) || 0));
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120) ?? "";
  const pattern = `%${search.replace(/[\\%_]/gu, "\\$&")}%`;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let result;
  if (entity === "encyclopedia") {
    let query = supabase.from("encyclopedia").select("id,title,category,content,image_url,source,source_url,media_url,image_source,image_credit,image_license,created_at", { count: "exact" });
    if (search) query = query.ilike("title", pattern);
    result = await query.order("created_at", { ascending: false }).range(from, to);
  } else if (entity === "places") {
    let query = supabase.from("places").select("id,name,category,description,latitude,longitude,image_url,opening_time,closing_time,source,source_url,created_at", { count: "exact" });
    if (search) query = query.ilike("name", pattern);
    result = await query.order("created_at", { ascending: false }).range(from, to);
  } else {
    let query = supabase.from("translations").select("id,khowar,urdu,english,example,verified,source,created_at", { count: "exact" });
    if (search) query = query.ilike("khowar", pattern);
    result = await query.order("created_at", { ascending: false }).range(from, to);
  }
  if (result.error) return NextResponse.json({ error: "Could not load content records." }, { status: 503 });
  return NextResponse.json({ records: result.data ?? [], count: result.count ?? 0, page, pageSize: PAGE_SIZE });
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !isAdminContentEntity(body.entity)) return NextResponse.json({ error: "Unsupported content entity." }, { status: 400 });

  const validated = validateAdminContentRecord(body.entity, body.record, "create");
  if (!validated.record) return NextResponse.json({ error: validated.errors.join(" ") }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  let result;
  if (body.entity === "encyclopedia") {
    result = await supabase.from("encyclopedia").insert(validated.record as never).select("id").single();
  } else if (body.entity === "places") {
    result = await supabase.from("places").insert(validated.record as never).select("id").single();
  } else {
    result = await supabase.from("translations").insert(validated.record as never).select("id").single();
  }
  if (result.error) return NextResponse.json({ error: "Could not create the record." }, { status: 400 });
  return NextResponse.json({ saved: true, id: result.data.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !isAdminContentEntity(body.entity) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid content update." }, { status: 400 });
  }

  const validated = validateAdminContentRecord(body.entity, body.record, "update");
  if (!validated.record) return NextResponse.json({ error: validated.errors.join(" ") }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  let result;
  if (body.entity === "encyclopedia") {
    result = await supabase.from("encyclopedia").update(validated.record as never).eq("id", body.id).select("id").maybeSingle();
  } else if (body.entity === "places") {
    result = await supabase.from("places").update(validated.record as never).eq("id", body.id).select("id").maybeSingle();
  } else {
    result = await supabase.from("translations").update(validated.record as never).eq("id", body.id).select("id").maybeSingle();
  }
  if (result.error) return NextResponse.json({ error: "Could not update the record." }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "Record not found." }, { status: 404 });
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !isAdminContentEntity(body.entity) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid content deletion." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  let result;
  if (body.entity === "encyclopedia") result = await supabase.from("encyclopedia").delete().eq("id", body.id).select("id").maybeSingle();
  else if (body.entity === "places") result = await supabase.from("places").delete().eq("id", body.id).select("id").maybeSingle();
  else result = await supabase.from("translations").delete().eq("id", body.id).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: "Could not delete the record." }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "Record not found." }, { status: 404 });
  return NextResponse.json({ deleted: true });
}