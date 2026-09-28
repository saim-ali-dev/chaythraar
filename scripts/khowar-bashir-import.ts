import { config } from "dotenv";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database, Json } from "@/lib/supabase/database.types";
import { KHOWAR_GLOSSARY_SOURCE } from "@/lib/khowar/glossary";
import { findBashirEntry, parseBashirDirectory, type BashirEntry } from "@/lib/khowar/bashir-parser";
import { createRagSupabaseClient } from "@/lib/supabase/rag";

config({ path: resolve(process.cwd(), ".env.local") });

type GlossaryInsert = Database["public"]["Tables"]["khowar_glossary"]["Insert"];
const BATCH_SIZE = 250;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: npm run khowar:bashir -- [--dry-run] [--import] [--report PATH]");
    console.log("Dry-run is the default. Database writes require --import and no ambiguous or malformed entries.");
    return;
  }
  if (args.includes("--import") && args.includes("--dry-run")) throw new Error("Choose either --import or --dry-run.");

  const report = parseBashirDirectory(resolve(process.cwd(), "bashir_chunks"));
  const accepted = report.entries.filter((entry) => !entry.ambiguous && !entry.malformed);
  assertUniqueSourceEntryIds(accepted);
  console.log("Bashir corpus validation");
  console.log(`logical entries: ${report.entries.length}`);
  console.log(`accepted entries: ${accepted.length}`);
  console.log("duplicate accepted source_entry_id values: 0");
  console.log(`ambiguous entries: ${report.ambiguousEntries.length}`);
  console.log(`malformed entries: ${report.malformedEntries.length}`);
  console.log(`subentries: ${report.subentryCount}`);
  console.log(`entries spanning fragments: ${report.entriesSpanningFragments}`);
  console.log(`entries spanning PDF pages: ${report.entriesSpanningPdfPages}`);
  console.log(`entries with alternate pronunciations: ${report.entriesWithAlternatePronunciations}`);
  console.log(`entries with etymology: ${report.entriesWithEtymology}`);
  console.log(`entries with source/contributor markers: ${report.entriesWithSourceMarkers}`);
  console.log(`ambiguous layout lines: ${report.ambiguousLayoutLines}`);

  const reportOption = args.indexOf("--report");
  if (reportOption >= 0) {
    const reportPath = resolve(args[reportOption + 1] ?? "bashir-validation-report.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`full validation report: ${reportPath}`);
  }

  for (const headword of ["bas1", "bas bik", "baseék", "basésum", "drung", "dunyá", "andabá", "-ar", "dros"]) {
    const entry = findBashirEntry(report, headword);
    console.log(`\n${headword}:`);
    if (entry) console.log(JSON.stringify(renderEntry(entry, headword), null, 2));
    else console.log("NOT FOUND");
  }

  console.log("\nAmbiguous entries:");
  for (const entry of report.ambiguousEntries.slice(0, 40)) {
    console.log(`${entry.headword} (p. ${entry.pdfPage}, line ${entry.sourceLineStart}, column ${entry.column}) ${entry.originalChunkFilenames.join(", ")}`);
  }
  if (report.ambiguousEntries.length > 40) console.log(`... ${report.ambiguousEntries.length - 40} more; pass --report PATH for full detail.`);
  console.log("Malformed entries:");
  for (const entry of report.malformedEntries) {
    console.log(`${entry.headword} (p. ${entry.pdfPage}, line ${entry.sourceLineStart}) ${entry.rawSourceExcerpt}`);
  }

  if (!args.includes("--import")) {
    console.log("\nDry-run only; no database records were written.");
    return;
  }
  if (report.ambiguousEntries.length || report.malformedEntries.length) {
    throw new Error("Database import stopped: resolve all ambiguous/malformed records before writing any rows.");
  }
  if (!KHOWAR_GLOSSARY_SOURCE.projectPermission.trim()) {
    throw new Error("Database import stopped: project-specific permission is not recorded.");
  }
  await persistEntries(accepted.map(toInsert));
}

function renderEntry(entry: BashirEntry, queriedHeadword: string) {
  const subentry = entry.subentries.find((candidate) => candidate.headword === queriedHeadword);
  return {
    sourceEntryId: entry.sourceEntryId,
    headword: subentry?.headword ?? entry.headword,
    parentHeadword: subentry ? entry.headword : null,
    partOfSpeech: subentry?.partOfSpeech ?? entry.partOfSpeech,
    englishGloss: subentry?.gloss ?? entry.englishGloss,
    subentries: entry.subentries,
    page: entry.pdfPage,
    sourceLineStart: entry.sourceLineStart,
    sourceLineEnd: entry.sourceLineEnd,
    originalChunkFilenames: entry.originalChunkFilenames,
    ambiguous: entry.ambiguous,
    malformed: entry.malformed,
    rawSourceExcerpt: entry.rawSourceExcerpt,
  };
}

function toInsert(entry: BashirEntry): GlossaryInsert {
  return {
    source_entry_id: entry.sourceEntryId,
    headword: entry.headword,
    english_gloss: entry.englishGloss,
    english_definition: entry.englishDefinition,
    cultural_notes: null,
    examples: [],
    source_author: KHOWAR_GLOSSARY_SOURCE.author,
    source_title: KHOWAR_GLOSSARY_SOURCE.title,
    publication_year: KHOWAR_GLOSSARY_SOURCE.publicationYear,
    source_url: KHOWAR_GLOSSARY_SOURCE.sourceUrl,
    source_doi: KHOWAR_GLOSSARY_SOURCE.doi,
    source_locator: `PDF page ${entry.pdfPage}, lines ${entry.sourceLineStart}-${entry.sourceLineEnd}`,
    license: KHOWAR_GLOSSARY_SOURCE.license,
    attribution: KHOWAR_GLOSSARY_SOURCE.attribution,
    project_permission: KHOWAR_GLOSSARY_SOURCE.projectPermission,
    provenance: entry.provenance as Json,
  };
}

function assertUniqueSourceEntryIds(entries: BashirEntry[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.sourceEntryId)) duplicates.add(entry.sourceEntryId);
    seen.add(entry.sourceEntryId);
  }
  if (duplicates.size > 0) {
    throw new Error(`Duplicate accepted Bashir source_entry_id values: ${[...duplicates].slice(0, 10).join(", ")}`);
  }
}

async function persistEntries(rows: GlossaryInsert[]) {
  const supabase = createRagSupabaseClient();
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const { error } = await supabase.from("khowar_glossary").upsert(rows.slice(offset, offset + BATCH_SIZE), {
      onConflict: "source_doi,source_entry_id",
    });
    if (error) throw new Error(`Could not import Bashir glossary entries: ${error.message}`);
  }
  console.log(`\nUpserted ${rows.length} Bashir glossary entries. Existing rows outside this source identity were not changed or deleted.`);
}

void main().catch((error: unknown) => {
  console.error(`Bashir import failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});