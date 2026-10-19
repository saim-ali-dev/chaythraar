import { ingestAllNewsSources } from "@/lib/news/ingest";
import { handleNewsIngestionCron } from "@/lib/news/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return handleNewsIngestionCron(request, process.env.CRON_SECRET, ingestAllNewsSources);
}