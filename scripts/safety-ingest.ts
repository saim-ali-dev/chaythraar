import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

import { ndmaAdapter } from "@/lib/safety/sources/ndma";
import { pmdAdapter } from "@/lib/safety/sources/pmd";
import { pdmaAdapter } from "@/lib/safety/sources/pdma";
import { chitralTimesSafetyAdapter, chitralTodaySafetyAdapter } from "@/lib/safety/sources/news";
import { ingestSafetySource } from "@/lib/safety/ingest";

async function main() {
  const sources = [
    { name: "NDMA Pakistan", ingest: () => ingestSafetySource(ndmaAdapter) },
    { name: "PMD Pakistan Meteorological Department", ingest: () => ingestSafetySource(pmdAdapter) },
    { name: "PDMA Khyber Pakhtunkhwa", ingest: () => ingestSafetySource(pdmaAdapter) },
    { name: "Chitral Times safety news", ingest: () => ingestSafetySource(chitralTimesSafetyAdapter) },
    { name: "ChitralToday safety news", ingest: () => ingestSafetySource(chitralTodaySafetyAdapter) },
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

function printReport(sourceName: string, report: Awaited<ReturnType<typeof ingestSafetySource>>) {
  console.log(sourceName);
  console.log(`raw records fetched: ${report.fetched}`);
  console.log(`rejected as stale (>7 days): ${report.stale}`);
  console.log(`normalized records: ${report.normalized}`);
  console.log(`Chitral-irrelevant records: ${report.irrelevant}`);
  console.log(`duplicate within run: ${report.duplicates_within_run}`);
  console.log(`duplicate of existing DB record: ${report.duplicates_existing}`);
  console.log(`records inserted: ${report.inserted}`);
  console.log(`records updated: ${report.updated}`);
  console.log(`expired according to policy: ${report.expired}`);
  console.log(`records skipped: ${report.skipped}`);
  console.log(`records rejected: ${report.rejected}`);
  console.log(`failed: ${report.failed}`);
  for (const example of report.expiration_examples) {
    console.log(`expiry example: ${example.title} | freshness ${example.freshness_date} | expires ${example.expires_at}`);
  }
  for (const error of report.errors) console.error(`Error: ${error}`);
}

void main();
