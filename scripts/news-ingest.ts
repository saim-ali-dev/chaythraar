import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { ingestChitralTimes } from "@/lib/news/ingest";

async function main() {
  const report = await ingestChitralTimes();

  console.log(`Chitral Times ingestion complete.`);
  console.log(`Articles discovered: ${report.discovered}`);
  console.log(`Articles normalized: ${report.normalized}`);
  console.log(`Articles inserted: ${report.inserted}`);
  console.log(`Articles skipped: ${report.skipped}`);
  console.log(`Duplicates: ${report.duplicates}`);

  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`Error: ${error}`);
    process.exitCode = 1;
  }
}

void main();
