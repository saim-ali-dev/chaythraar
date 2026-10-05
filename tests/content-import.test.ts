import test from "node:test";
import assert from "node:assert/strict";

import {
  extractLiveColumns,
  normalizeDuplicateKey,
  parseImportArguments,
  parseImportDocument,
  planImport,
  runWritePhase,
  validateRecord,
} from "../scripts/content-import";

test("duplicate key trims, collapses whitespace, and compares case-insensitively only", () => {
  assert.equal(normalizeDuplicateKey("  Example   Place  "), "example place");
  assert.notEqual(normalizeDuplicateKey("Example-Place"), normalizeDuplicateKey("Example Place"));
  assert.notEqual(normalizeDuplicateKey("Example Place East"), normalizeDuplicateKey("Example Place"));
});

test("CLI requires an explicit file and entity and accepts only declared options", () => {
  assert.deepEqual(parseImportArguments(["--file", "reviewed.json", "--entity", "places", "--dry-run"]), {
    file: "reviewed.json",
    entity: "places",
    dryRun: true,
    updateExisting: false,
  });
  assert.throws(() => parseImportArguments(["--entity", "places"]), /--file is required/);
  assert.throws(() => parseImportArguments(["--file", "reviewed.json"]), /--entity is required/);
  assert.throws(() => parseImportArguments(["--file", "reviewed.json", "--entity", "other"]), /must be encyclopedia or places/);
  assert.throws(() => parseImportArguments(["--file", "reviewed.json", "--entity", "places", "--unexpected"]), /Unknown argument/);
});

test("JSON input requires version 1 and an explicit records array", () => {
  assert.deepEqual(parseImportDocument({ version: 1, records: [] }), { version: 1, records: [] });
  assert.throws(() => parseImportDocument({ records: [] }), /version must be 1/);
  assert.throws(() => parseImportDocument({ version: 1 }), /records array/);
  assert.throws(() => parseImportDocument({ version: 1, records: [], extra: true }), /Unknown JSON root field/);
});

test("live column extraction reads actual table properties and rejects malformed schemas", () => {
  const columns = extractLiveColumns({
    definitions: {
      places: { properties: { id: {}, name: {}, category: {}, source: {} } },
    },
  }, "places");
  assert.deepEqual([...columns], ["id", "name", "category", "source"]);
  assert.throws(() => extractLiveColumns({}, "places"), /no table definitions/);
  assert.throws(() => extractLiveColumns({ definitions: {} }, "places"), /no places table definition/);
});

test("Encyclopedia requires title, category, and content and validates supplied URLs", () => {
  const accepted = validateRecord("encyclopedia", {
    title: "  Example   Entry ",
    category: "Reference",
    content: "A synthetic test description.",
    source_url: "https://example.test/source",
    image_url: null,
  });
  assert.deepEqual(accepted.errors, []);
  assert.equal(accepted.identity, "example entry");
  assert.equal(accepted.record?.title, "Example Entry");
  assert.equal(accepted.record?.source_url, "https://example.test/source");
  assert.equal(accepted.record?.image_url, null);

  assert.match(validateRecord("encyclopedia", { title: "", category: "Reference", content: "Text" }).errors.join(" "), /title is required/);
  assert.match(validateRecord("encyclopedia", { title: "Example", category: "", content: "Text" }).errors.join(" "), /category is required/);
  assert.match(validateRecord("encyclopedia", { title: "Example", category: "Reference", content: " " }).errors.join(" "), /content is required/);
  assert.match(validateRecord("encyclopedia", { title: "Example", category: "Reference", content: "Text", source_url: "javascript:alert(1)" }).errors.join(" "), /source_url must be a valid HTTP\(S\) URL/);
  assert.match(validateRecord("encyclopedia", { title: "Example", category: "Reference", content: "Text", extra: "not supported" }).errors.join(" "), /Unknown field/);
});

test("Places validates required values, paired coordinates, ranges, URLs, and supplied hours", () => {
  const accepted = validateRecord("places", {
    name: "Example   Valley",
    category: "Valley",
    description: "Synthetic test location.",
    latitude: 35.5,
    longitude: 72.25,
    source_url: "https://example.test/place",
    opening_time: "08:30",
    image_credit: "Synthetic test credit",
  });
  assert.deepEqual(accepted.errors, []);
  assert.equal(accepted.identity, "example valley");
  assert.equal(accepted.record?.latitude, 35.5);
  assert.equal(accepted.record?.longitude, 72.25);
  assert.equal(accepted.record?.image_credit, "Synthetic test credit");

  assert.match(validateRecord("places", { name: "Example", category: "Valley", latitude: 35 }).errors.join(" "), /both be present or both be absent/);
  assert.match(validateRecord("places", { name: "Example", category: "Valley", latitude: 91, longitude: 72 }).errors.join(" "), /latitude must be/);
  assert.match(validateRecord("places", { name: "Example", category: "Valley", latitude: 35, longitude: -181 }).errors.join(" "), /longitude must be/);
  assert.match(validateRecord("places", { name: "Example", category: "Valley", latitude: null, longitude: null, image_url: "file:///tmp/image" }).errors.join(" "), /image_url must be a valid HTTP\(S\) URL/);
  assert.match(validateRecord("places", { name: "Example", category: "Valley", opening_time: "25:90" }).errors.join(" "), /opening_time must use/);
});

test("fields absent from the live schema are rejected only when explicitly supplied", () => {
  const columns = new Set(["id", "name", "category", "description"]);
  const withoutOptional = validateRecord("places", { name: "Example", category: "Valley" }, columns);
  assert.deepEqual(withoutOptional.errors, []);

  const withUnavailableOptional = validateRecord("places", {
    name: "Example",
    category: "Valley",
    source_url: "https://example.test/place",
  }, columns);
  assert.match(withUnavailableOptional.errors.join(" "), /source_url is not available in the live places schema/);
});

test("planning inserts new names, skips existing names, and rejects normalized batch duplicates", () => {
  const plan = planImport("places", [
    { name: "New   Place", category: "Valley" },
    { name: "  EXISTING place ", category: "Valley" },
    { name: "new place", category: "Pass" },
    { name: "Existing-Place", category: "Valley" },
  ], [{ id: "existing-1", name: "Existing Place" }], false);

  assert.deepEqual(plan.map((entry) => entry.outcome), ["inserted", "skipped_existing", "rejected", "inserted"]);
  assert.match(plan[1].reason ?? "", /Matches existing record existing-1/);
  assert.match(plan[2].reason ?? "", /Duplicate normalized name in input batch/);
});

test("updates are opt-in, target a unique match, and contain only explicitly supplied fields", () => {
  const existing = [{ id: "entry-1", title: "Example Entry" }];
  const safePlan = planImport("encyclopedia", [{ title: " example  entry ", category: "Culture", content: "Replacement text" }], existing, false);
  assert.equal(safePlan[0].outcome, "skipped_existing");

  const updatePlan = planImport("encyclopedia", [{ title: " example  entry ", category: "Culture", content: "Replacement text" }], existing, true);
  assert.equal(updatePlan[0].outcome, "updated");
  assert.deepEqual(Object.keys(updatePlan[0].record ?? {}).sort(), ["category", "content", "title"]);
  assert.equal("image_url" in (updatePlan[0].record ?? {}), false);

  const ambiguous = planImport("places", [{ name: "Example Place", category: "Valley" }], [
    { id: "place-1", name: "Example Place" },
    { id: "place-2", name: " example   place " },
  ], true);
  assert.equal(ambiguous[0].outcome, "rejected");
  assert.match(ambiguous[0].reason ?? "", /ambiguous update/);
});

test("dry-run write phase never invokes the supplied writer", async () => {
  let writes = 0;
  await runWritePhase(true, async () => { writes += 1; });
  assert.equal(writes, 0);
  await runWritePhase(false, async () => { writes += 1; });
  assert.equal(writes, 1);
});
