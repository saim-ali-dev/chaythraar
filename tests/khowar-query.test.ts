import assert from "node:assert/strict";
import { test } from "node:test";
import { getKhowarGlossarySearchTerms, isKhowarGlossaryQuestion } from "../src/lib/assistant/khowar-query";

test("Khowar phrase questions exclude conversational filler from lexical search", () => {
  assert.deepEqual(
    getKhowarGlossarySearchTerms("How do you say how are you in Khowar?"),
    [],
  );
  assert.equal(isKhowarGlossaryQuestion("How do you say how are you in Khowar?"), true);
});

test("word meaning questions preserve Unicode headwords", () => {
  assert.deepEqual(getKhowarGlossarySearchTerms("What does čiri mean?"), ["čiri"]);
  assert.equal(isKhowarGlossaryQuestion("What does čiri mean?"), true);
});

test("example requests and short direct lookups use glossary retrieval", () => {
  assert.equal(isKhowarGlossaryQuestion("Show me an example of this Khowar word."), true);
  assert.equal(isKhowarGlossaryQuestion("dros"), true);
});

test("long unrelated questions stay on the existing shared retrieval path", () => {
  assert.equal(isKhowarGlossaryQuestion("What is the weather like across the valley today?"), false);
  assert.equal(isKhowarGlossaryQuestion("Tell me about Chitral."), false);
});