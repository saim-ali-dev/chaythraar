import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { ingestAllNewsSources } from "@/lib/news/ingest";

async function main() {
  const report = await ingestAllNewsSources();
  printReport(report);
  if (report.errors.length > 0) process.exitCode = 1;
}

function printReport(report: Awaited<ReturnType<typeof ingestAllNewsSources>>) {
  console.log("News ingestion");
  console.log(`fetched: ${report.fetched}`);
  console.log(`normalized: ${report.normalized}`);
  console.log(`recent: ${report.recent}`);
  console.log(`duplicates: ${report.duplicates}`);
  console.log(`new: ${report.new}`);
  console.log(`updated: ${report.updated}`);
  console.log(`unchanged: ${report.unchanged}`);
  console.log(`selected: ${report.selected}`);
  console.log(`not selected: ${report.not_selected}`);
  console.log(`summarized: ${report.summarized}`);
  console.log(`reused: ${report.reused}`);
  console.log(`inserted: ${report.inserted}`);
  console.log(`updated rows: ${report.updatedRows}`);
  console.log(`skipped: ${report.skipped}`);
  console.log(`failed: ${report.failed}`);
  console.log(`summarization failures: ${report.summarization_failed}`);
  for (const error of report.errors) console.error(`Error: ${error}`);
}

void main();
