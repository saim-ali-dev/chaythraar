import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { config } from "dotenv";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type ContentEntity = "encyclopedia" | "places";
export type ImportOutcome = "inserted" | "skipped_existing" | "updated" | "rejected";
export type ContentRecord = Record<string, unknown>;

export type ExistingName = {
  id: string;
  title?: string;
  name?: string;
};

export type ImportPlanEntry = {
  recordNumber: number;
  identity: string | null;
  record: ContentRecord | null;
  existingId?: string;
  outcome: ImportOutcome;
  reason?: string;
};

export type ImportOptions = {
  file: string;
  entity: ContentEntity;
  dryRun: boolean;
  updateExisting: boolean;
};

type ValidationResult = {
  record: ContentRecord | null;
  identity: string | null;
  errors: string[];
};

type ImportDocument = {
  version: 1;
  records: unknown[];
};

const PAGE_SIZE = 500;
const WRITE_BATCH_SIZE = 100;
const URL_FIELDS = new Set(["image_url", "source_url", "media_url"]);
const COMMON_OPTIONAL_TEXT_FIELDS = ["source", "image_source", "image_credit", "image_license"] as const;
const ENCYCLOPEDIA_FIELDS = new Set([
  "title", "category", "content", "image_url", "source", "source_url", "media_url",
  "image_source", "image_credit", "image_license",
]);
const PLACE_FIELDS = new Set([
  "name", "category", "description", "latitude", "longitude", "image_url", "opening_time",
  "closing_time", "source", "source_url", "image_source", "image_credit", "image_license",
]);
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/;

type EncyclopediaInsert = Database["public"]["Tables"]["encyclopedia"]["Insert"];
type EncyclopediaUpdate = Database["public"]["Tables"]["encyclopedia"]["Update"];
type PlaceInsert = Database["public"]["Tables"]["places"]["Insert"];
type PlaceUpdate = Database["public"]["Tables"]["places"]["Update"];

export function normalizeDuplicateKey(value: string) {
  return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function parseImportArguments(args: string[]): ImportOptions {
  let file: string | undefined;
  let entity: ContentEntity | undefined;
  let dryRun = false;
  let updateExisting = false;
  const seen = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") {
      if (seen.has(argument)) throw new Error("Pass --dry-run only once.");
      seen.add(argument);
      dryRun = true;
      continue;
    }
    if (argument === "--update-existing") {
      if (seen.has(argument)) throw new Error("Pass --update-existing only once.");
      seen.add(argument);
      updateExisting = true;
      continue;
    }
    if (argument !== "--file" && argument !== "--entity") {
      throw new Error(`Unknown argument: ${argument}`);
    }
    if (seen.has(argument)) throw new Error(`Pass ${argument} only once.`);
    seen.add(argument);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
    index += 1;
    if (argument === "--file") file = value;
    else if (value === "encyclopedia" || value === "places") entity = value;
    else throw new Error("--entity must be encyclopedia or places.");
  }

  if (!file) throw new Error("--file is required; the importer never discovers files automatically.");
  if (!entity) throw new Error("--entity is required and must be encyclopedia or places.");
  return { file, entity, dryRun, updateExisting };
}

export async function runWritePhase(dryRun: boolean, write: () => Promise<void>) {
  if (!dryRun) await write();
}

export function parseImportDocument(input: unknown): ImportDocument {
  if (!isObject(input)) throw new Error("The JSON root must be an object.");
  const unknownProperties = Object.keys(input).filter((key) => key !== "version" && key !== "records");
  if (unknownProperties.length) throw new Error(`Unknown JSON root field(s): ${unknownProperties.join(", ")}.`);
  if (input.version !== 1) throw new Error("JSON version must be 1.");
  if (!Array.isArray(input.records)) throw new Error("The JSON root must contain a records array.");
  return { version: 1, records: input.records };
}

export function extractLiveColumns(schema: unknown, entity: ContentEntity) {
  if (!isObject(schema) || !isObject(schema.definitions)) {
    throw new Error("The live Supabase schema response has no table definitions.");
  }
  const definition = schema.definitions[entity];
  if (!isObject(definition) || !isObject(definition.properties)) {
    throw new Error(`The live Supabase schema response has no ${entity} table definition.`);
  }
  return new Set(Object.keys(definition.properties));
}

export function validateRecord(
  entity: ContentEntity,
  input: unknown,
  liveColumns?: ReadonlySet<string>,
): ValidationResult {
  const errors: string[] = [];
  if (!isObject(input)) return { record: null, identity: null, errors: ["Record must be a JSON object."] };

  const allowedFields = entity === "encyclopedia" ? ENCYCLOPEDIA_FIELDS : PLACE_FIELDS;
  const unknownFields = Object.keys(input).filter((key) => !allowedFields.has(key));
  if (unknownFields.length) errors.push(`Unknown field(s): ${unknownFields.join(", ")}.`);
  if (liveColumns) {
    for (const field of Object.keys(input)) {
      if (allowedFields.has(field) && !liveColumns.has(field)) {
        errors.push(`${field} is not available in the live ${entity} schema.`);
      }
    }
  }

  const record: ContentRecord = {};
  const nameField = entity === "encyclopedia" ? "title" : "name";
  const requiredFields = entity === "encyclopedia" ? ["title", "category", "content"] : ["name", "category"];

  for (const field of requiredFields) {
    const value = input[field];
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${field} is required and must be a non-empty string.`);
    } else {
      record[field] = field === nameField
        ? value.trim().replace(/\s+/gu, " ")
        : value.trim();
    }
  }

  const optionalTextFields = entity === "encyclopedia"
    ? [...COMMON_OPTIONAL_TEXT_FIELDS, "source_url", "media_url", "image_url"]
    : ["description", ...COMMON_OPTIONAL_TEXT_FIELDS, "source_url", "image_url"];

  for (const field of optionalTextFields) {
    if (!Object.hasOwn(input, field)) continue;
    const value = input[field];
    if (value === null) {
      record[field] = null;
      continue;
    }
    if (typeof value !== "string") {
      errors.push(`${field} must be a string or null.`);
      continue;
    }
    const trimmed = value.trim();
    if (URL_FIELDS.has(field)) {
      if (!isValidHttpUrl(trimmed)) errors.push(`${field} must be a valid HTTP(S) URL or null.`);
      else record[field] = trimmed;
    } else {
      record[field] = trimmed || null;
    }
  }

  if (entity === "places") {
    validateCoordinates(input, record, errors);
    validateOpeningHours(input, record, errors);
  }

  const name = record[nameField];
  const identity = typeof name === "string" && name.trim()
    ? normalizeDuplicateKey(name)
    : null;
  return { record: errors.length ? null : record, identity, errors };
}

export function planImport(
  entity: ContentEntity,
  inputs: unknown[],
  existingRecords: ExistingName[],
  updateExisting: boolean,
  liveColumns?: ReadonlySet<string>,
): ImportPlanEntry[] {
  const validations = inputs.map((input) => validateRecord(entity, input, liveColumns));
  const firstRecordByKey = new Map<string, number>();
  const duplicateRecordNumbers = new Set<number>();

  validations.forEach((validation, index) => {
    if (!validation.record || !validation.identity) return;
    const firstRecord = firstRecordByKey.get(validation.identity);
    if (firstRecord !== undefined) duplicateRecordNumbers.add(index);
    else firstRecordByKey.set(validation.identity, index + 1);
  });

  const existingByKey = new Map<string, ExistingName[]>();
  const nameField = entity === "encyclopedia" ? "title" : "name";
  for (const existing of existingRecords) {
    const name = existing[nameField];
    if (typeof name !== "string") continue;
    const key = normalizeDuplicateKey(name);
    if (!key) continue;
    existingByKey.set(key, [...(existingByKey.get(key) ?? []), existing]);
  }

  return validations.map((validation, index) => {
    const recordNumber = index + 1;
    if (validation.errors.length) {
      return {
        recordNumber,
        identity: validation.identity,
        record: null,
        outcome: "rejected",
        reason: validation.errors.join(" "),
      };
    }
    if (duplicateRecordNumbers.has(index)) {
      const firstRecord = firstRecordByKey.get(validation.identity!);
      return {
        recordNumber,
        identity: validation.identity,
        record: null,
        outcome: "rejected",
        reason: `Duplicate normalized ${nameField} in input batch; first appears at record ${firstRecord}.`,
      };
    }

    const matches = existingByKey.get(validation.identity!) ?? [];
    if (!matches.length) {
      return { recordNumber, identity: validation.identity, record: validation.record, outcome: "inserted" };
    }
    if (!updateExisting || matches.length > 1) {
      return {
        recordNumber,
        identity: validation.identity,
        record: validation.record,
        existingId: matches.length === 1 ? matches[0].id : undefined,
        outcome: matches.length > 1 && updateExisting ? "rejected" : "skipped_existing",
        reason: matches.length > 1
          ? `Matches ${matches.length} existing records; refusing an ambiguous update.`
          : `Matches existing record ${matches[0].id}.`,
      };
    }
    return {
      recordNumber,
      identity: validation.identity,
      record: validation.record,
      existingId: matches[0].id,
      outcome: "updated",
    };
  });
}

function validateCoordinates(input: ContentRecord, record: ContentRecord, errors: string[]) {
  const hasLatitude = Object.hasOwn(input, "latitude");
  const hasLongitude = Object.hasOwn(input, "longitude");
  if (hasLatitude !== hasLongitude) {
    errors.push("latitude and longitude must either both be present or both be absent.");
    return;
  }
  if (!hasLatitude) return;

  const latitude = input.latitude;
  const longitude = input.longitude;
  if (latitude === null && longitude === null) {
    record.latitude = null;
    record.longitude = null;
    return;
  }
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.push("latitude must be a finite number between -90 and 90.");
  }
  if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.push("longitude must be a finite number between -180 and 180.");
  }
  if (typeof latitude === "number" && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === "number" && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
    record.latitude = latitude;
    record.longitude = longitude;
  }
}

function validateOpeningHours(input: ContentRecord, record: ContentRecord, errors: string[]) {
  for (const field of ["opening_time", "closing_time"] as const) {
    if (!Object.hasOwn(input, field)) continue;
    const value = input[field];
    if (value === null) {
      record[field] = null;
    } else if (typeof value !== "string" || !TIME_PATTERN.test(value.trim())) {
      errors.push(`${field} must use 24-hour HH:MM[:SS] time or null.`);
    } else {
      record[field] = value.trim();
    }
  }
}

function isValidHttpUrl(value: string) {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isObject(value: unknown): value is ContentRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function loadExistingNames(
  supabase: SupabaseClient<Database>,
  entity: ContentEntity,
): Promise<ExistingName[]> {
  const names: ExistingName[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    if (entity === "encyclopedia") {
      const { data, error } = await supabase.from("encyclopedia")
        .select("id,title")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(`Could not read existing Encyclopedia names: ${error.message}`);
      names.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    } else {
      const { data, error } = await supabase.from("places")
        .select("id,name")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(`Could not read existing Place names: ${error.message}`);
      names.push(...(data ?? []));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }
  return names;
}

export async function verifyLiveColumns(entity: ContentEntity) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceRoleKey) throw new Error("Missing Supabase server configuration.");

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/u, "")}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        accept: "application/openapi+json",
      },
    });
  } catch {
    throw new Error("Could not inspect the live Supabase schema.");
  }
  if (!response.ok) throw new Error(`Could not inspect the live Supabase schema (HTTP ${response.status}).`);

  let schema: unknown;
  try {
    schema = await response.json();
  } catch {
    throw new Error("The live Supabase schema response was not valid JSON.");
  }
  const columns = extractLiveColumns(schema, entity);
  const requiredColumns = entity === "encyclopedia"
    ? ["id", "title", "category", "content"]
    : ["id", "name", "category"];
  const missingColumns = requiredColumns.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    throw new Error(`The live ${entity} schema is missing required importer column(s): ${missingColumns.join(", ")}.`);
  }
  return columns;
}

async function insertBatch(
  supabase: SupabaseClient<Database>,
  entity: ContentEntity,
  records: ContentRecord[],
) {
  if (entity === "encyclopedia") {
    return supabase.from("encyclopedia").insert(records as unknown as EncyclopediaInsert[]);
  }
  return supabase.from("places").insert(records as unknown as PlaceInsert[]);
}

async function updateRecord(
  supabase: SupabaseClient<Database>,
  entity: ContentEntity,
  record: ContentRecord,
  id: string,
) {
  if (entity === "encyclopedia") {
    return supabase.from("encyclopedia").update(record as EncyclopediaUpdate).eq("id", id);
  }
  return supabase.from("places").update(record as PlaceUpdate).eq("id", id);
}

async function performWrites(
  supabase: SupabaseClient<Database>,
  entity: ContentEntity,
  plan: ImportPlanEntry[],
) {
  for (let offset = 0; offset < plan.length; offset += WRITE_BATCH_SIZE) {
    const batch = plan.slice(offset, offset + WRITE_BATCH_SIZE);
    const inserts = batch.filter((entry) => entry.outcome === "inserted" && entry.record);
    for (let rowOffset = 0; rowOffset < inserts.length; rowOffset += WRITE_BATCH_SIZE) {
      const insertEntries = inserts.slice(rowOffset, rowOffset + WRITE_BATCH_SIZE);
      const { error } = await insertBatch(supabase, entity, insertEntries.map((entry) => entry.record!));
      if (error) {
        for (const entry of insertEntries) {
          entry.outcome = "rejected";
          entry.reason = `Database insert failed: ${error.message}`;
        }
      }
    }

    for (const entry of batch) {
      if (entry.outcome !== "updated" || !entry.record || !entry.existingId) continue;
      const { error } = await updateRecord(supabase, entity, entry.record, entry.existingId);
      if (error) {
        entry.outcome = "rejected";
        entry.reason = `Database update failed: ${error.message}`;
      }
    }
  }
}

function printSummary(plan: ImportPlanEntry[], dryRun: boolean) {
  const count = (outcome: ImportOutcome) => plan.filter((entry) => entry.outcome === outcome).length;
  console.log(`Total: ${plan.length}`);
  console.log(`Inserted: ${count("inserted")}${dryRun ? " (planned; dry-run)" : ""}`);
  console.log(`Skipped: ${count("skipped_existing")}`);
  console.log(`Updated: ${count("updated")}${dryRun ? " (planned; dry-run)" : ""}`);
  console.log(`Rejected: ${count("rejected")}`);

  const rejected = plan.filter((entry) => entry.outcome === "rejected");
  if (rejected.length) {
    console.log("Rejected records:");
    for (const entry of rejected) {
      const identity = entry.identity ? ` (${entry.identity})` : "";
      console.log(`  Record ${entry.recordNumber}${identity}: ${entry.reason ?? "Rejected."}`);
    }
  }
}

async function main(args = process.argv.slice(2)) {
  try {
    if (args.length === 1 && args[0] === "--help") {
      console.log("Usage: npm run content:import -- --file path/to/reviewed.json --entity encyclopedia|places [--dry-run] [--update-existing]");
      return;
    }
    const options = parseImportArguments(args);
    config({ path: resolve(process.cwd(), ".env.local") });

    const filePath = resolve(process.cwd(), options.file);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (error) {
      throw new Error(`Could not read/parse the explicit JSON file ${filePath}: ${error instanceof Error ? error.message : "invalid JSON"}`);
    }
    const document = parseImportDocument(parsedJson);
    const supabase = createAdminSupabaseClient();

    const liveColumns = await verifyLiveColumns(options.entity);
    const existingNames = await loadExistingNames(supabase, options.entity);
    const plan = planImport(options.entity, document.records, existingNames, options.updateExisting, liveColumns);

    await runWritePhase(options.dryRun, () => performWrites(supabase, options.entity, plan));
    printSummary(plan, options.dryRun);
    if (plan.some((entry) => entry.outcome === "rejected")) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Content import failed.");
    process.exitCode = 1;
  }
}

if (basename(process.argv[1] ?? "") === "content-import.ts") void main();
