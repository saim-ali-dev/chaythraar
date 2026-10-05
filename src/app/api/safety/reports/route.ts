import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/http-security";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const PHOTO_BUCKET = "safety-report-photos";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const HAZARD_TYPES = new Set(["Road blockage", "Flooding", "Landslide", "Severe weather", "Wildlife", "Infrastructure damage", "Other"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function textField(form: FormData, name: string, maxLength: number, required = false) {
  const value = form.get(name);
  if (typeof value !== "string") throw new Error(`${name} is invalid.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new Error(`${name} is required.`);
  if (trimmed.length > maxLength) throw new Error(`${name} must be ${maxLength} characters or fewer.`);
  return trimmed;
}

function validPhotoSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });

  let uploadedPath: string | null = null;
  try {
    const form = await request.formData();
    const title = textField(form, "title", 160, true);
    const description = textField(form, "description", 5000, true);
    const locationName = textField(form, "location_name", 240, true);
    const additionalDetails = textField(form, "additional_details", 3000);
    const type = textField(form, "type", 80, true);
    const severity = textField(form, "severity", 20, true);
    const observedAtInput = textField(form, "reported_at", 80);
    const observedAt = observedAtInput ? new Date(observedAtInput) : new Date();

    if (!HAZARD_TYPES.has(type)) throw new Error("Choose a valid hazard category.");
    if (!SEVERITIES.has(severity)) throw new Error("Choose a valid severity.");
    if (Number.isNaN(observedAt.getTime())) throw new Error("Observed date and time are invalid.");

    const latitudeInput = textField(form, "latitude", 32);
    const longitudeInput = textField(form, "longitude", 32);
    if (Boolean(latitudeInput) !== Boolean(longitudeInput)) throw new Error("Enter both coordinates, or leave both blank.");
    const latitude = latitudeInput ? Number(latitudeInput) : null;
    const longitude = longitudeInput ? Number(longitudeInput) : null;
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) throw new Error("Latitude must be between -90 and 90.");
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) throw new Error("Longitude must be between -180 and 180.");

    const photoValue = form.get("photo");
    let photoBytes: Buffer | null = null;
    let photoType: string | null = null;
    if (photoValue instanceof File && photoValue.size > 0) {
      if (photoValue.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 8 MB or smaller.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(photoValue.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
      photoBytes = Buffer.from(await photoValue.arrayBuffer());
      if (!validPhotoSignature(photoBytes, photoValue.type)) throw new Error("The selected file does not match a supported image format.");
      photoType = photoValue.type;
    }

    const supabase = createAdminSupabaseClient();
    if (photoBytes && photoType) {
      const extension = photoType === "image/jpeg" ? "jpg" : photoType === "image/png" ? "png" : "webp";
      uploadedPath = `${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(uploadedPath, photoBytes, {
        contentType: photoType,
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw new Error("Photo upload failed. Please try again.");
    }

    const { data, error } = await supabase.from("hazards").insert({
      type,
      title,
      description,
      additional_details: additionalDetails || null,
      severity,
      status: "unverified",
      source: null,
      source_name: null,
      source_url: null,
      source_type: "community",
      location_name: locationName,
      latitude,
      longitude,
      reported_at: observedAt.toISOString(),
      issued_at: observedAt.toISOString(),
      expires_at: null,
      moderation_status: "pending",
      submitted_at: new Date().toISOString(),
      photo_path: uploadedPath,
    }).select("id").single();

    if (error) throw new Error("The report could not be saved. Please try again.");
    return NextResponse.json({ submitted: true, id: data.id }, { status: 201 });
  } catch (error) {
    if (uploadedPath) {
      const supabase = createAdminSupabaseClient();
      await supabase.storage.from(PHOTO_BUCKET).remove([uploadedPath]);
    }
    const message = error instanceof Error ? error.message : "The report could not be submitted.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
