import test from "node:test";
import assert from "node:assert/strict";

import { isFoodCategory, isMusicCategory, normalizeContentCategory } from "../src/lib/content-categories";

test("normalizes category names consistently", () => {
  assert.equal(normalizeContentCategory("Music"), "music");
  assert.equal(normalizeContentCategory(" Food "), "food");
  assert.equal(normalizeContentCategory("Folk Culture"), "folk culture");
});

test("music and food categories are recognized reliably", () => {
  assert.equal(isMusicCategory("Music"), true);
  assert.equal(isMusicCategory("Culture"), false);
  assert.equal(isFoodCategory("Food"), true);
  assert.equal(isFoodCategory("Music"), false);
});
