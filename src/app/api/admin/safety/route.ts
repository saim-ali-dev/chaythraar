import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
const HAZARD_STATES = new Set(["active", "resolved", "closed", "expired", "unverified"]);
type HazardUpdate = Database["public"]["Tables"]["hazards"]["Update"];

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.from("hazards")
      .select("id,type,title,description,additional_details,latitude,longitude,severity,status,source_type,location_name,reported_at,submitted_at,photo_path,moderation_status,approved_by,approved_at,rejected_by,rejected_at")
      .eq("source_type", "community")
      .order("submitted_at", { ascending: false });
    if (error) throw error;

    const ids = (data ?? []).map((record) => record.id);
    const votesResult = ids.length
      ? await supabase.from("safety_report_votes").select("report_id,vote").in("report_id", ids)
      : { data: [], error: null };
    if (votesResult.error) throw votesResult.error;

    const reports = await Promise.all((data ?? []).map(async (record) => {
      let photoUrl: string | null = null;
      if (record.photo_path) {
        const { data: signedPhoto } = await supabase.storage.from("safety-report-photos").createSignedUrl(record.photo_path, 3600);
        photoUrl = signedPhoto?.signedUrl ?? null;
      }
      const reportVotes = votesResult.data?.filter((vote) => vote.report_id === record.id) ?? [];
      return {
        ...record,
        photo_url: photoUrl,
        votes: {
          correct: reportVotes.filter((vote) => vote.vote === "correct").length,
          incorrect: reportVotes.filter((vote) => vote.vote === "incorrect").length,
        },
      };
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Unable to load safety moderation records.", error);
    return NextResponse.json({ error: "Safety reports could not be loaded." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Admin access required." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string" || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: report, error: readError } = await supabase.from("hazards")
      .select("id,source_type,moderation_status")
      .eq("id", body.id)
      .maybeSingle();
    if (readError) throw readError;
    if (!report || report.source_type !== "community") return NextResponse.json({ error: "Community report not found." }, { status: 404 });

    const adminLabel = adminUser.email?.trim().slice(0, 120) || "Admin";
    if (body.action === "approve" || body.action === "reject") {
      const moderationStatus: "approved" | "rejected" = body.action === "approve" ? "approved" : "rejected";
      const requestedHazardStatus = typeof body.hazard_status === "string" ? body.hazard_status : "active";
      if (body.action === "approve" && !HAZARD_STATES.has(requestedHazardStatus)) {
        return NextResponse.json({ error: "Invalid hazard lifecycle status." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const update: HazardUpdate = body.action === "approve"
        ? { moderation_status: moderationStatus, approved_by: adminLabel, approved_at: now, rejected_by: null, rejected_at: null, status: requestedHazardStatus }
        : { moderation_status: moderationStatus, rejected_by: adminLabel, rejected_at: now, approved_by: null, approved_at: null };
      const { error } = await supabase.from("hazards").update(update).eq("id", report.id);
      if (error) throw error;
      return NextResponse.json({ saved: true, moderation_status: moderationStatus });
    }

    if (body.action === "edit") {
      const update: HazardUpdate = {};
      const validateText = (key: string, maximum: number, optional: boolean) => {
        const value = body[key];
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        if (trimmed.length > maximum || (!optional && !trimmed)) throw new Error(`Invalid ${key}.`);
        return trimmed || null;
      };
      try {
        const title = validateText("title", 160, false);
        const description = validateText("description", 5000, false);
        const additionalDetails = validateText("additional_details", 3000, true);
        const location = validateText("location_name", 240, false);
        const type = validateText("type", 80, false);
        if (title !== undefined) update.title = title;
        if (description !== undefined && description !== null) update.description = description;
        if (additionalDetails !== undefined) update.additional_details = additionalDetails;
        if (location !== undefined) update.location_name = location;
        if (type !== undefined && type !== null) update.type = type;
      } catch (validationError) {
        return NextResponse.json({ error: validationError instanceof Error ? validationError.message : "Invalid report details." }, { status: 400 });
      }
      if (!Object.keys(update).length) return NextResponse.json({ error: "No editable fields were provided." }, { status: 400 });
      const { error } = await supabase.from("hazards").update(update).eq("id", report.id);
      if (error) throw error;
      return NextResponse.json({ saved: true });
    }

    return NextResponse.json({ error: "Unsupported moderation action." }, { status: 400 });
  } catch (error) {
    console.error("Unable to update safety moderation record.", error);
    return NextResponse.json({ error: "The report could not be updated." }, { status: 503 });
  }
}
