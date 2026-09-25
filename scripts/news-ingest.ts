import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { ingestChitralTimes, ingestChitralToday } from "@/lib/news/ingest";

async function main() {
  const sources = [
    { name: "Chitral Times", ingest: ingestChitralTimes },
    { name: "ChitralToday", ingest: ingestChitralToday },
  ];
  let hasErrors = false;

  for (const source of sources) {
    try {
      const report = await source.ingest();
      printReport(source.name, report);
      if (report.errors.length > 0) hasErrors = true;
    } catch (error) {
      hasErrors = true;
      console.error(`${source.name}`);
      console.error(`Failed: ${error instanceof Error ? error.message : "unknown source error"}`);
    }
  }

  if (hasErrors) process.exitCode = 1;
}

function printReport(sourceName: string, report: Awaited<ReturnType<typeof ingestChitralTimes>>) {
  console.log(sourceName);
  console.log(`discovered: ${report.discovered}`);
  console.log(`normalized: ${report.normalized}`);
  console.log(`new: ${report.new}`);
  console.log(`existing: ${report.already_existing}`);
  console.log(`summarized: ${report.summarized}`);
  console.log(`inserted: ${report.inserted}`);
  console.log(`skipped: ${report.skipped}`);
  console.log(`failed: ${report.failed}`);
  console.log(`duplicates: ${report.duplicates}`);
  console.log(`summarization failures: ${report.summarization_failed}`);
  for (const error of report.errors) console.error(`Error: ${error}`);
}

void main();
