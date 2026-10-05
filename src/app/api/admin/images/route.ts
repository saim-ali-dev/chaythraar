import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RecordType = "encyclopedia" | "places" | "news" | "site_media";
type ImageValues = {
  image_url: string | null;
  image_source: string | null;
  image_credit: string | null;
  image_license: string | null;
};

function normalizeRecords(type: RecordType, rows: Array<Record<string, unknown>>) {
  return rows.map((row) => ({
    id: String(row.id),
    type,
    title: String(row.title ?? row.name ?? "Untitled"),
    category: String(row.category ?? "Uncategorized"),
    image_url: typeof row.image_url === "string" ? row.image_url : null,
    media_url: typeof row.media_url === "string" ? row.media_url : null,
    image_source: typeof row.image_source === "string" ? row.image_source : "",
    image_credit: typeof row.image_credit === "string" ? row.image_credit : "",
    image_license: typeof row.image_license === "string" ? row.image_license : "",
  }));
}

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });

  try {
    const supabase = createAdminSupabaseClient();
    const [encyclopedia, places, news, siteMedia] = await Promise.all([
      supabase.from("encyclopedia").select("id,title,category,image_url,media_url,image_source,image_credit,image_license").order("title"),
      supabase.from("places").select("id,name,category,image_url,image_source,image_credit,image_license").order("name"),
      supabase.from("news").select("id,title,category,image_url,image_source,image_credit,image_license").order("title"),
      supabase.from("site_media").select("id,title,category,image_url,image_source,image_credit,image_license").order("title"),
    ]);
    const failed = [encyclopedia.error, places.error, news.error, siteMedia.error].find(Boolean);
    if (failed) throw failed;

    return NextResponse.json({ records: [
      ...normalizeRecords("encyclopedia", encyclopedia.data ?? []),
      ...normalizeRecords("places", places.data ?? []),
      ...normalizeRecords("news", news.data ?? []),
      ...normalizeRecords("site_media", siteMedia.data ?? []),
    ] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load image records.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

function parseImageUrl(value: unknown, field: string) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2048) throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`${field} must be a valid HTTP or HTTPS URL.`);
  return value;
}

function parseText(value: unknown, field: string) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 500) throw new Error(`${field} must be 500 characters or fewer.`);
  return value.trim() || null;
}

export async function PATCH(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !["encyclopedia", "places", "news", "site_media"].includes(String(body.type)) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid image record." }, { status: 400 });
  }

  try {
    const type = body.type as RecordType;
    const values: ImageValues = {
      image_url: parseImageUrl(body.image_url, "Image URL"),
      image_source: parseText(body.image_source, "Image source"),
      image_credit: parseText(body.image_credit, "Image credit"),
      image_license: parseText(body.image_license, "License"),
    };
    const mediaUrl = type === "encyclopedia" ? parseImageUrl(body.media_url, "Media URL") : null;
    const supabase = createAdminSupabaseClient();
    const update = type === "encyclopedia" ? { ...values, media_url: mediaUrl } : values;
    const { error } = await supabase.from(type).update(update).eq("id", body.id);
    if (error) throw error;

    revalidatePath("/", "layout");
    return NextResponse.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save image details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
