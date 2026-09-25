import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { detectOriginalLanguage } from "@/lib/news/chitral-times";
import { isNewsSummarizationConfigured, summarizeNews } from "@/lib/news/summarize-core";
import { createNewsIngestionSupabaseClient } from "@/lib/news/supabase";
import type { Database } from "@/lib/supabase/database.types";

type PendingNewsRow = Pick<Database["public"]["Tables"]["news"]["Row"], "id" | "title" | "summary" | "source" | "original_title" | "original_language" | "headline" | "summary_short">;

type SummaryReport = {
  found: number;
  summarized: number;
  skipped: number;
  failed: number;
};

async function main() {
  const report: SummaryReport = { found: 0, summarized: 0, skipped: 0, failed: 0 };
  const supabase = createNewsIngestionSupabaseClient();
  const { data, error } = await supabase
    .from("news")
    .select("id, title, summary, source, original_title, original_language, headline, summary_short")
    .or("headline.is.null,summary_short.is.null");

  if (error) throw new Error(`Could not find news rows needing summaries: ${error.message}`);

  const rows = (data ?? []) as PendingNewsRow[];
  report.found = rows.length;

  if (!isNewsSummarizationConfigured()) {
    report.skipped = rows.length;
    printReport(report, "AI summarization is not configured; no rows were updated.");
    return;
  }

  for (const row of rows) {
    try {
      const originalTitle = row.original_title ?? row.title;
      const generated = await summarizeNews({
        originalTitle,
        sourceDescription: row.summary,
        originalLanguage: row.original_language ?? detectOriginalLanguage(originalTitle),
        sourceName: row.source,
      });

      if (!generated) {
        report.skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("news")
        .update({ headline: generated.headline, summary_short: generated.summary_short })
        .eq("id", row.id);

      if (updateError) throw new Error(updateError.message);
      report.summarized += 1;
    } catch (error) {
      report.failed += 1;
      console.error(`Could not summarize news row ${row.id}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  printReport(report);
}

function printReport(report: SummaryReport, note?: string) {
  console.log(`News summarization complete.`);
  console.log(`Found: ${report.found}`);
  console.log(`Summarized: ${report.summarized}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Failed: ${report.failed}`);
  if (note) console.log(note);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "News summarization failed.");
  process.exitCode = 1;
});
