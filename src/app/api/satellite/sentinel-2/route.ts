import { NextResponse } from "next/server";
import { getLatestSentinel2Scene } from "@/lib/satellite/sentinel2";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getLatestSentinel2Scene();
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}