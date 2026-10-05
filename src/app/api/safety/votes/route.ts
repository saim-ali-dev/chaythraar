import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const reportId = parameters.get("reportId");
  const requestedIds = reportId ? [reportId] : (parameters.get("reportIds") ?? "").split(",").filter(Boolean);
  if (!requestedIds.length || requestedIds.length > 100 || requestedIds.some((id) => !UUID_PATTERN.test(id))) {
    return NextResponse.json({ error: "Invalid report id list." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: reports, error: reportError } = await supabase
    .from("hazards")
    .select("id,source_type,moderation_status")
    .in("id", requestedIds);
  if (reportError) return NextResponse.json({ error: "Community feedback is unavailable." }, { status: 503 });
  const approvedIds = (reports ?? [])
    .filter((report) => report.source_type === "community" && report.moderation_status === "approved")
    .map((report) => report.id);
  if (reportId && !approvedIds.includes(reportId)) {
    return NextResponse.json({ error: "Community feedback is unavailable." }, { status: 404 });
  }

  const countsByReportId: Record<string, { correct: number; incorrect: number }> = Object.fromEntries(
    approvedIds.map((id) => [id, { correct: 0, incorrect: 0 }]),
  );
  if (approvedIds.length) {
    const { data: votes, error: votesError } = await supabase
      .from("safety_report_votes")
      .select("report_id,vote")
      .in("report_id", approvedIds);
    if (votesError) return NextResponse.json({ error: "Community feedback is unavailable." }, { status: 503 });

    for (const vote of votes) {
      if (vote.vote === "correct") countsByReportId[vote.report_id].correct += 1;
      else countsByReportId[vote.report_id].incorrect += 1;
    }
  }

  return reportId
    ? NextResponse.json({ counts: countsByReportId[reportId] })
    : NextResponse.json({ countsByReportId });
}
