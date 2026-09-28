import assert from "node:assert/strict";
import { test } from "node:test";
import { findBashirEntry, parseBashirDirectory, parseBashirFragments, readBashirFragments } from "../src/lib/khowar/bashir-parser";

test("numeric fragment order and entry assembly cross fragment boundaries", () => {
  const report = parseBashirFragments([
    { filename: "bashir-020-0011-0011.txt", page: 20, lineStart: 11, lineEnd: 11, text: "   ‘to continue the meaning’ {MNN}\n" },
    { filename: "bashir-020-0001-0010.txt", page: 20, lineStart: 1, lineEnd: 1, text: "dros (n) ‘Drosh, a large town\n" },
  ]);
  assert.equal(report.entries[0]?.headword, "dros");
  assert.equal(report.entries[0]?.originalChunkFilenames.length, 2);
  assert.match(report.entries[0]?.rawSourceExcerpt ?? "", /to continue/u);
});

test("running headers are retained separately and excluded from entry excerpts", () => {
  const report = parseBashirFragments([
    { filename: "bashir-020-0001-0001.txt", page: 20, lineStart: 1, lineEnd: 1, text: "alpha (n) ‘first meaning’\n" },
    {
      filename: "bashir-021-0001-0002.txt", page: 21, lineStart: 1, lineEnd: 2,
      text: "alpha        Bashir, Khowar-English Lexicon – with cultural and etymological notes       beta\n   continued meaning {MNN}\n",
    },
  ]);
  assert.equal(report.pageFurnitureLines.length, 1);
  assert.match(report.pageFurnitureLines[0]?.raw ?? "", /Bashir, Khowar-English Lexicon/u);
  assert.doesNotMatch(report.entries[0]?.rawSourceExcerpt ?? "", /Bashir, Khowar-English Lexicon/u);
  assert.equal(report.entries[0]?.ambiguous, false);
  assert.deepEqual(report.entries[0]?.provenance.pagesSpanned, [20, 21]);
});

test("a visible gutter and right-column POS marker resolve same-line ownership", () => {
  const left = "x".repeat(60);
  const report = parseBashirFragments([{
    filename: "bashir-020-0001-0001.txt", page: 20, lineStart: 1, lineEnd: 1,
    text: `${left}       right (n) ‘right gloss’\n`,
  }]);
  const rightEntry = report.entries.find((entry) => entry.headword === "right");
  assert.ok(rightEntry);
  assert.equal(rightEntry.ambiguous, false);
});

test("left and right entries on one physical row keep independent excerpts", () => {
  const leftEntry = "left (n) ‘left gloss’";
  const raw = `${leftEntry.padEnd(61, " ")}right (n) ‘right gloss’`;
  const report = parseBashirFragments([{
    filename: "bashir-020-0001-0001.txt", page: 20, lineStart: 1, lineEnd: 1, text: `${raw}\n`,
  }]);
  const left = report.entries.find((entry) => entry.headword === "left");
  const right = report.entries.find((entry) => entry.headword === "right");
  assert.ok(left);
  assert.ok(right);
  assert.equal(left.column, 1);
  assert.equal(right.column, 2);
  assert.match(left.rawSourceExcerpt, /left gloss/u);
  assert.doesNotMatch(left.rawSourceExcerpt, /right/u);
  assert.match(right.rawSourceExcerpt, /right gloss/u);
  assert.doesNotMatch(right.rawSourceExcerpt, /left/u);
  assert.equal((left.provenance.rawPhysicalSourceLines as Array<{ raw: string }>)[0]?.raw, raw);
  assert.equal((right.provenance.rawPhysicalSourceLines as Array<{ raw: string }>)[0]?.raw, raw);
});

test("known Bashir entries preserve top-level and subentry distinctions", () => {
  const report = parseBashirDirectory(`${process.cwd()}/bashir_chunks`);
  assert.equal(report.ambiguousEntries.length, 37);
  for (const headword of ["bas1", "bas bik", "baseék", "basésum", "drung", "dunyá", "andabá", "-ar", "dros"]) {
    assert.ok(findBashirEntry(report, headword), `missing ${headword}`);
  }
  assert.deepEqual(findBashirEntry(report, "bas1")?.subentries.map((subentry) => subentry.headword), ["bas bik", "baseék", "basésum"]);
  assert.equal(findBashirEntry(report, "basésum")?.subentries.find((subentry) => subentry.headword === "basésum")?.gloss, "night camp");
  assert.equal(findBashirEntry(report, "bas bik")?.headword, "bas1");
  assert.equal(findBashirEntry(report, "drung")?.englishGloss, "tall (person)");
  assert.equal(report.entries.find((entry) => entry.headword === "andabá")?.kind, "top-level");
  assert.equal(report.entries.find((entry) => entry.headword === "-ar")?.kind, "top-level");
  const dunya = report.entries.find((entry) => entry.headword === "dunyá");
  assert.equal(dunya?.kind, "top-level");
  assert.ok(!dunya?.subentries.some((subentry) => ["dzah", "dzahí"].includes(subentry.headword)));
  assert.equal(report.entries.find((entry) => entry.headword === "dzah")?.kind, "top-level");
  assert.equal(dunya?.ambiguous, true);
  assert.equal((dunya?.provenance.crossColumnContinuationCandidate as { sourceFilename: string } | null)?.sourceFilename, "bashir-052-0001-0010.txt");
  assert.equal(report.entries.find((entry) => entry.headword === "drung")?.ambiguous, false);
  const anuSuffix = report.entries.find((entry) => entry.headword === "-ánu");
  assert.equal(anuSuffix?.ambiguous, true);
  assert.ok(anuSuffix?.rawSourceExcerpt);

  for (const [headword, column] of [["ka", 2], ["aqá", 1], ["hínǰu", 1], ["hókum", 1]] as const) {
    const confirmedEntry = report.entries.find((entry) => entry.headword === headword);
    assert.ok(confirmedEntry, `missing confirmed entry ${headword}`);
    assert.equal(confirmedEntry.column, column, `${headword} column`);
    assert.equal(confirmedEntry.ambiguous, false, `${headword} ambiguity`);
    assert.equal(confirmedEntry.provenance.columnResolution && (confirmedEntry.provenance.columnResolution as { column: number }).column, column);
  }
  const kaEntry = report.entries.find((entry) => entry.headword === "ka");
  assert.match(kaEntry?.rawSourceExcerpt ?? "", /ar korík/u);
  assert.equal(report.ambiguousEntries.filter((entry) => !entry.provenance.crossColumnContinuationCandidate).length, 0);
});

test("entry excerpts and metadata use only their resolved column text", () => {
  const report = parseBashirDirectory(`${process.cwd()}/bashir_chunks`);
  const bas = report.entries.find((entry) => entry.headword === "bas1");
  const barabar = report.entries.find((entry) => entry.headword === "barabár");
  assert.ok(bas);
  assert.ok(barabar);

  assert.doesNotMatch(bas.rawSourceExcerpt, /barabár|RAKRW/u);
  assert.doesNotMatch((bas.provenance.sourceMarkerDetails as string[]).join(" "), /RAKRW/u);
  assert.ok(!(bas.provenance.etymologyDetails as string[]).includes("(< Prs.)"));
  assert.ok((bas.provenance.etymologyDetails as string[]).includes("[< Skt. (M:1973)]"));

  assert.match(barabar.rawSourceExcerpt, /barabár/u);
  assert.doesNotMatch(barabar.rawSourceExcerpt, /bas1/u);

  const basPhysicalRow = (bas.provenance.rawPhysicalSourceLines as Array<{ sourceLine: number; raw: string }>)
    .find((line) => line.sourceLine === bas.sourceLineStart);
  assert.ok(basPhysicalRow);
  assert.match(basPhysicalRow.raw, /bas1/u);
  assert.match(basPhysicalRow.raw, /about traveling today/u);
});

test("-áli emits one complete POS entry with a stable source identity", () => {
  const directory = `${process.cwd()}/bashir_chunks`;
  const report = parseBashirDirectory(directory);
  const aliEntries = report.entries.filter((entry) => entry.pdfPage === 15
    && entry.column === 2
    && entry.sourceLineStart === 37
    && entry.headword === "-áli");

  assert.equal(aliEntries.length, 1);
  const ali = aliEntries[0];
  assert.ok(ali);
  assert.deepEqual(ali.partOfSpeech, ["n"]);
  assert.equal(ali.englishGloss, "bound nominalizing morpheme - suffixed to");
  assert.match(ali.rawSourceExcerpt, /-áli \(n\) ‘bound nominalizing morpheme/u);

  const fragment = readBashirFragments(directory).find((item) => item.filename === "bashir-015-0031-0040.txt");
  assert.ok(fragment);
  const repeated = parseBashirFragments([fragment]).entries.filter((entry) => entry.headword === "-áli");
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0]?.sourceEntryId, ali.sourceEntryId);

  const acceptedIds = report.entries
    .filter((entry) => !entry.ambiguous && !entry.malformed)
    .map((entry) => entry.sourceEntryId);
  assert.equal(new Set(acceptedIds).size, acceptedIds.length);
});

test("column layout ambiguity is retained instead of silently guessed", () => {
  const report = parseBashirFragments([{
    filename: "bashir-020-0001-0001.txt", page: 20, lineStart: 1, lineEnd: 1,
       text: `${"x".repeat(68)}right (n) ‘right gloss’\n`,
  }]);
  assert.ok(report.ambiguousLayoutLines > 0);
});