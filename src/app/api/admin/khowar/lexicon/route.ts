import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const term = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const kind = request.nextUrl.searchParams.get("kind") ?? "lexicon";
  if (kind !== "lexicon" && kind !== "glossary") return NextResponse.json({ error: "Unsupported Khowar data set." }, { status: 400 });
  if (term.length < 2 || term.length > 120) return NextResponse.json({ entries: [] });

  const escapedTerm = term.replace(/[\\%_]/gu, "\\$&");
  const supabase = createAdminSupabaseClient();
  const result = kind === "lexicon"
    ? await supabase.from("khowar_lexicon")
      .select("id,dataset_id,record_type,record_index,entry,source_name,source_url,license,attribution")
      .ilike("entry", `${escapedTerm}%`)
      .order("dataset_id").order("record_type").order("record_index")
      .limit(50)
    : await supabase.from("khowar_glossary")
      .select("id,headword,english_gloss,english_definition,cultural_notes,source_author,source_title,publication_year,source_url,source_doi,source_locator,license,attribution")
      .ilike("headword", `${escapedTerm}%`)
      .order("headword")
      .limit(50);
  const { data, error } = result;
  if (error) return NextResponse.json({ error: "Could not search the imported lexicon." }, { status: 503 });
  return NextResponse.json({ entries: data ?? [] });
}