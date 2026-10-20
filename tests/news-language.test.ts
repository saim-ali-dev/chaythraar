import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { detectNewsTextLanguage, NEWS_LANGUAGES, resolveNewsLanguageContent } from "@/lib/news/language";
import type { NewsLanguageEntry } from "@/lib/news/language";

function makeEntry(overrides: Partial<NewsLanguageEntry> = {}): NewsLanguageEntry {
  return {
    title: "Local road update",
    original_title: "Local road update",
    original_language: "en",
    summary: "A road update from the source.",
    headline: "CHAYTHRAAR road update",
    summary_short: "The road is open today.",
    headline_ur: "سڑک کی تازہ صورتحال",
    summary_short_ur: "آج سڑک کھلی ہے۔",
    ...overrides,
  };
}

test("language selection returns matching headline text in both directions", () => {
  const entry = makeEntry();
  const english = resolveNewsLanguageContent(entry, "en");
  const urdu = resolveNewsLanguageContent(entry, "ur");
  const englishAgain = resolveNewsLanguageContent(entry, "en");

  assert.equal(english.language, "en");
  assert.equal(english.headline, "CHAYTHRAAR road update");
  assert.equal(urdu.language, "ur");
  assert.equal(urdu.headline, "سڑک کی تازہ صورتحال");
  assert.equal(englishAgain.headline, english.headline);
});

test("missing translations use language-matched fallback text without relabeling source text", () => {
  const englishOnly = resolveNewsLanguageContent(makeEntry({ headline_ur: null, summary_short_ur: null }), "ur");

  assert.equal(englishOnly.language, "ur");
  assert.equal(englishOnly.headline, "اردو ترجمہ دستیاب نہیں۔");
  assert.equal(englishOnly.summary, "اردو ترجمہ دستیاب نہیں۔");
});

test("already-Urdu headlines are never presented as English", () => {
  const entry = makeEntry({
    title: "چترال میں سڑک کھل گئی",
    original_title: "چترال میں سڑک کھل گئی",
    original_language: "ur",
    headline: "چترال میں سڑک کھل گئی",
    headline_ur: null,
  });

  assert.equal(resolveNewsLanguageContent(entry, "en").headline, "English translation unavailable.");
  assert.equal(resolveNewsLanguageContent(entry, "ur").headline, "چترال میں سڑک کھل گئی");
});

test("mixed-script legacy headlines do not override a clear language-matched source title", () => {
  const entry = makeEntry({
    headline: "Road خبر",
    headline_ur: null,
    original_title: "Road closure update",
  });

  assert.equal(detectNewsTextLanguage(entry.headline), "mixed");
  assert.equal(resolveNewsLanguageContent(entry, "en").headline, "Road closure update");
  assert.equal(resolveNewsLanguageContent(entry, "ur").headline, "اردو ترجمہ دستیاب نہیں۔");
});

test("cached Urdu headlines with Latin proper names remain Urdu", () => {
  const entry = makeEntry({ headline_ur: "KP وزیراعلیٰ کا چترال دورہ" });

  assert.equal(resolveNewsLanguageContent(entry, "ur").headline, "KP وزیراعلیٰ کا چترال دورہ");
});

test("both English and Urdu options are available for every news source", () => {
  assert.deepEqual(NEWS_LANGUAGES.map(({ code }) => code), ["en", "ur"]);
  assert.equal(resolveNewsLanguageContent(makeEntry(), "ur").language, "ur");
});

test("ChitralToday cards render the Urdu language option", () => {
  const cardSource = readFileSync(join(process.cwd(), "src/components/news/news-card.tsx"), "utf8");

  assert.match(cardSource, /<NewsLanguageView entry=\{entry\} \/>/);
  assert.doesNotMatch(cardSource, /original_language\s*===\s*"ur"/);
  assert.deepEqual(NEWS_LANGUAGES.map(({ code }) => code), ["en", "ur"]);
});