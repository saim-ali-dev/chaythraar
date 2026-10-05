import test from "node:test";
import assert from "node:assert/strict";

import { isAdminContentEntity, validateAdminContentRecord } from "../src/lib/admin-content";

test("admin content entity allowlist excludes arbitrary tables", () => {
  assert.equal(isAdminContentEntity("encyclopedia"), true);
  assert.equal(isAdminContentEntity("places"), true);
  assert.equal(isAdminContentEntity("translations"), true);
  assert.equal(isAdminContentEntity("khowar_lexicon"), false);
});

test("Encyclopedia creates require content and validate HTTP URLs", () => {
  const valid = validateAdminContentRecord("encyclopedia", {
    title: "  Synthetic entry ", category: "Culture", content: "Original test text.",
    source_url: "https://example.test/source",
  }, "create");
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.record?.title, "Synthetic entry");
  assert.match(validateAdminContentRecord("encyclopedia", {
    title: "Entry", category: "Culture", content: "Text", image_url: "javascript:alert(1)",
  }, "create").errors.join(" "), /image_url must be a valid HTTP\(S\) URL/);
  assert.match(validateAdminContentRecord("encyclopedia", { title: "Entry", category: "Culture" }, "create").errors.join(" "), /content is required/);
});

test("Places require paired in-range coordinates and valid time fields", () => {
  const valid = validateAdminContentRecord("places", {
    name: "Synthetic Place", category: "Village", latitude: 35.5, longitude: 72.1,
    opening_time: "08:30:00",
  }, "create");
  assert.deepEqual(valid.errors, []);
  assert.match(validateAdminContentRecord("places", {
    name: "Synthetic Place", category: "Village", latitude: 35.5,
  }, "create").errors.join(" "), /supplied together/);
  assert.match(validateAdminContentRecord("places", {
    name: "Synthetic Place", category: "Village", latitude: 91, longitude: 72,
  }, "create").errors.join(" "), /latitude must be/);
  assert.match(validateAdminContentRecord("places", {
    name: "Synthetic Place", category: "Village", opening_time: "25:61",
  }, "create").errors.join(" "), /opening_time must use/);
});

test("Translation updates validate explicit fields and reject unknown fields", () => {
  const partial = validateAdminContentRecord("translations", { verified: true, source: "Reviewed synthetic source" }, "update");
  assert.deepEqual(partial.errors, []);
  assert.deepEqual(partial.record, { verified: true, source: "Reviewed synthetic source" });
  assert.match(validateAdminContentRecord("translations", { verified: "yes" }, "update").errors.join(" "), /verified must be a boolean/);
  assert.match(validateAdminContentRecord("translations", { unexpected: "field" }, "update").errors.join(" "), /Unsupported field/);
  assert.match(validateAdminContentRecord("translations", {}, "update").errors.join(" "), /At least one editable field/);
});