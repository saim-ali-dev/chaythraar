import type { NewsIngestionReport } from "@/lib/news/types";

type NewsIngestion = () => Promise<NewsIngestionReport>;
type CronLogger = Pick<Console, "info" | "error">;

export async function handleNewsIngestionCron(
  request: Request,
  cronSecret: string | undefined,
  ingest: NewsIngestion,
  logger: CronLogger = console,
): Promise<Response> {
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const diagnosticsEnabled = new URL(request.url).searchParams.get("diagnostics") === "1";
  const startedAt = new Date();
  const startTime = startedAt.getTime();
  if (diagnosticsEnabled) {
    logger.info("News cron diagnostics started.", { startedAt: startedAt.toISOString() });
  }

  try {
    const report = await ingest();
    const summary = {
      fetched: report.fetched,
      inserted: report.inserted,
      updated: report.updatedRows,
      failed: report.failed,
    };

    if (diagnosticsEnabled) {
      const endedAt = new Date();
      logger.info("News cron diagnostics completed.", {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startTime,
        fetched: report.fetched,
        recent: report.recent,
        filtered: report.filtered,
        inserted: report.inserted,
        updated: report.updatedRows,
        failed: report.failed,
      });
    }

    if (report.failed > 0) {
      logger.error("News cron ingestion completed with failures.", summary);
      return Response.json({ success: false, error: "News ingestion completed with failures." }, { status: 503 });
    }

    logger.info("News cron ingestion completed.", summary);
    return Response.json({ success: true, ...summary });
  } catch {
    if (diagnosticsEnabled) {
      const endedAt = new Date();
      logger.info("News cron diagnostics completed.", {
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs: endedAt.getTime() - startTime,
        fetched: 0,
        recent: 0,
        filtered: 0,
        inserted: 0,
        updated: 0,
        failed: 1,
      });
    }
    logger.error("News cron ingestion failed.");
    return Response.json({ success: false, error: "News ingestion failed." }, { status: 503 });
  }
}