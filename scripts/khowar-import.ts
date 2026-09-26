import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { Database } from "@/lib/supabase/database.types";
import { createRagSupabaseClient } from "@/lib/supabase/rag";

config({ path: resolve(process.cwd(), ".env.local") });

const DATASET_ID = "cmlgxqdl80019mg07p0197u76";
const DATASET_NAME = "Khowar Word List";
const DATASET_URL = `https://mozilladatacollective.com/datasets/${DATASET_ID}`;
const DATASET_FILENAME = "khowar-word-list-3067143b.tar.gz";
const DATASET_SIZE = 65761;
const DATASET_SHA256 = "27ff8fc05f97e0d9891f3936fb52c78d1d8bc69726786fd9abae74a3b8fc93e9";
const EXPECTED_COUNTS = { letter: 66, word: 22141 } as const;
const SOURCE_NAME = "Forum for Language Initiatives (FLI)";
const LICENSE = "CC-BY-NC-4.0";
const ATTRIBUTION = "Forum for Language Initiatives (FLI), Khowar Word List, Mozilla Data Collective";
const BATCH_SIZE = 500;

type RecordType = keyof typeof EXPECTED_COUNTS;
type LexiconInsert = Database["public"]["Tables"]["khowar_lexicon"]["Insert"];

async function main() {
  const archivePath = getArchivePath();
  const archive = readFileSync(archivePath);
  const checksum = createHash("sha256").update(archive).digest("hex");
  if (archive.length !== DATASET_SIZE || checksum !== DATASET_SHA256) {
    throw new Error(`The archive does not match the official ${DATASET_NAME} file (size/checksum mismatch).`);
  }

  const entries = readArchiveEntries(archivePath);
  const supabase = createRagSupabaseClient();

  for (const recordType of ["letter", "word"] as const) {
    const records = entries[recordType];
    const rows: LexiconInsert[] = records.map((entry, recordIndex) => ({
      dataset_id: DATASET_ID,
      record_type: recordType,
      record_index: recordIndex,
      entry,
      source_name: SOURCE_NAME,
      source_url: DATASET_URL,
      license: LICENSE,
      attribution: ATTRIBUTION,
    }));

    for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
      const { error } = await supabase.from("khowar_lexicon").upsert(rows.slice(offset, offset + BATCH_SIZE), {
        onConflict: "dataset_id,record_type,record_index",
      });
      if (error) throw new Error(`Could not import Khowar ${recordType} records: ${error.message}`);
    }

    const { error: deleteError } = await supabase.from("khowar_lexicon")
      .delete()
      .eq("dataset_id", DATASET_ID)
      .eq("record_type", recordType)
      .gte("record_index", records.length);
    if (deleteError) throw new Error(`Could not remove obsolete Khowar ${recordType} records: ${deleteError.message}`);

    const { count, error: countError } = await supabase.from("khowar_lexicon")
      .select("id", { count: "exact", head: true })
      .eq("dataset_id", DATASET_ID)
      .eq("record_type", recordType);
    if (countError) throw new Error(`Could not verify Khowar ${recordType} records: ${countError.message}`);
    if (count !== records.length) throw new Error(`Expected ${records.length} Khowar ${recordType} records; found ${count ?? 0}.`);

    console.log(`${recordType}: ${count} records`);
  }
  console.log(`Imported ${entries.letter.length + entries.word.length} FLI lexical/script records. These are not translation pairs.`);
}

function getArchivePath(): string {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(`Usage: npm run khowar:import -- --archive /path/to/${DATASET_FILENAME}`);
    console.log("Download the official archive while signed in to Mozilla Data Collective, then pass its local path.");
    process.exit(0);
  }

  const archiveOption = args.indexOf("--archive");
  const archivePath = archiveOption >= 0 ? args[archiveOption + 1] : process.env.KHOWAR_ARCHIVE;
  if (!archivePath) {
    throw new Error(`Pass --archive /path/to/${DATASET_FILENAME} (the official download requires a Mozilla Data Collective sign-in).`);
  }
  return resolve(archivePath);
}

function readArchiveEntries(archivePath: string): Record<RecordType, string[]> {
  const filePaths = execFileSync("tar", ["-tzf", archivePath], { encoding: "utf8", maxBuffer: 1024 * 1024 })
    .split("\n")
    .map((filePath) => filePath.trim())
    .filter((filePath) => filePath.toLowerCase().endsWith(".txt"));
  if (filePaths.length !== 2) throw new Error(`Expected exactly two UTF-8 text files in the FLI archive; found ${filePaths.length}.`);

  const letterPath = filePaths.find((filePath) => /letter|alphabet/i.test(filePath));
  const wordPath = filePaths.find((filePath) => /word/i.test(filePath));
  if (!letterPath || !wordPath || letterPath === wordPath) {
    throw new Error("Could not identify the FLI letters and word-list files from their archive names.");
  }

  const textDecoder = new TextDecoder("utf-8", { fatal: true });
  const entries: Record<RecordType, string[]> = {
    letter: parseTokens(textDecoder.decode(execFileSync("tar", ["-xOzf", archivePath, letterPath], { maxBuffer: 1024 * 1024 }))),
    word: parseTokens(textDecoder.decode(execFileSync("tar", ["-xOzf", archivePath, wordPath], { maxBuffer: 4 * 1024 * 1024 }))),
  };

  for (const recordType of ["letter", "word"] as const) {
    if (entries[recordType].length !== EXPECTED_COUNTS[recordType]) {
      throw new Error(`Expected ${EXPECTED_COUNTS[recordType]} FLI ${recordType} tokens; found ${entries[recordType].length}.`);
    }
  }
  return entries;
}

function parseTokens(text: string): string[] {
  return text.trim().split(/\s+/u).filter(Boolean);
}

void main().catch((error: unknown) => {
  console.error(`Khowar import failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});