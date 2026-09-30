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
  for (const headword of ["bas1", "bas bik", "baseék", "basésum", "drung", "dunyá", "andabá", "-ar", "dros"]) {
    assert.ok(findBashirEntry(report, headword), `missing ${headword}`);
  }
  assert.deepEqual(findBashirEntry(report, "bas1")?.subentries.map((subentry) => subentry.headword), ["bas bik", "baseék", "basésum"]);
  assert.equal(findBashirEntry(report, "basésum")?.subentries.find((subentry) => subentry.headword === "basésum")?.gloss, "night camp");
  assert.equal(findBashirEntry(report, "bas bik")?.headword, "bas1");
  assert.equal(findBashirEntry(report, "drung")?.englishGloss, "tall (person)");
  assert.equal(report.entries.find((entry) => entry.headword === "andabá")?.kind, "top-level");
  assert.equal(report.entries.find((entry) => entry.headword === "-ar")?.kind, "top-level");
  const dunya = report.entries.find((entry) => entry.headword === "dunyá"
    && entry.pdfPage === 51 && entry.sourceLineStart === 64 && entry.column === 2);
  assert.equal(dunya?.kind, "top-level");
  assert.ok(!dunya?.subentries.some((subentry) => ["dzah", "dzahí"].includes(subentry.headword)));
  assert.equal(report.entries.find((entry) => entry.headword === "dzah")?.kind, "top-level");
  assert.equal(dunya?.ambiguous, false);
  const handoff = dunya?.provenance.crossColumnContinuationCandidate as {
    page: number;
    sourceLine: number;
    sourceFilename: string;
    column: number;
    rawSourceExcerpt: string;
  } | null;
  assert.deepEqual(handoff, {
    page: 52,
    sourceLine: 3,
    sourceFilename: "bashir-052-0001-0010.txt",
    column: 1,
    rawSourceExcerpt: "      will be tomorrow.’ (RKB); ‘society’ (RKB); (adj)            dzah /Other pronunc: zah/ (adj) ‘wet, moist’; (n)",
  });
  const dunyaPhysicalRows = dunya?.provenance.rawPhysicalSourceLines as Array<{
    pdfPage: number;
    sourceLine: number;
    column: number;
  }>;
  assert.ok(dunyaPhysicalRows.every((row) => row.column === 2));
  assert.ok(!dunyaPhysicalRows.some((row) => row.pdfPage === handoff?.page
    && row.sourceLine === handoff.sourceLine && row.column === handoff.column));
  assert.equal(report.entries.find((entry) => entry.headword === "drung")?.ambiguous, false);
  const anuSuffix = report.entries.find((entry) => entry.headword === "-ánu");
  assert.equal(anuSuffix?.ambiguous, false);
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
});

test("all PDF-confirmed right-column overrides stay exact and preserve page handoffs", () => {
  const directory = `${process.cwd()}/bashir_chunks`;
  const report = parseBashirDirectory(directory);
  const repeatedReport = parseBashirDirectory(directory);
  const confirmed = [
    { headword: "af", page: 14, line: 52, filename: "bashir-014-0051-0060.txt" },
    { headword: "-ánu", page: 17, line: 57, filename: "bashir-017-0051-0060.txt" },
    { headword: "bik2", page: 28, line: 52, filename: "bashir-028-0051-0060.txt" },
    { headword: "boγmá", page: 30, line: 55, filename: "bashir-030-0051-0060.txt" },
    { headword: "boót", page: 31, line: 60, filename: "bashir-031-0051-0060.txt" },
    { headword: "daržát", page: 46, line: 53, filename: "bashir-046-0051-0059.txt" },
    { headword: "dexdéx", page: 47, line: 61, filename: "bashir-047-0061-0068.txt" },
    { headword: "doík", page: 48, line: 59, filename: "bashir-048-0051-0060.txt", neighbor: "dilikáku" },
    { headword: "dunyá", page: 51, line: 64, filename: "bashir-051-0061-0068.txt" },
    { headword: "firíb", page: 55, line: 65, filename: "bashir-055-0061-0068.txt" },
    { headword: "kargín", page: 74, line: 58, filename: "bashir-074-0051-0060.txt" },
    { headword: "koc̣", page: 79, line: 56, filename: "bashir-079-0051-0060.txt", neighbor: "kitéik" },
    { headword: "-má", page: 91, line: 54, filename: "bashir-091-0051-0060.txt" },
    { headword: "mox", page: 97, line: 55, filename: "bashir-097-0051-0060.txt", neighbor: "močí" },
    { headword: "múṭu", page: 99, line: 56, filename: "bashir-099-0051-0059.txt" },
    { headword: "naṭíheɫ", page: 102, line: 64, filename: "bashir-102-0061-0068.txt" },
    { headword: "nokhí", page: 105, line: 57, filename: "bashir-105-0051-0060.txt" },
    { headword: "pálmu", page: 108, line: 58, filename: "bashir-108-0051-0060.txt" },
    { headword: "pontík", page: 114, line: 58, filename: "bashir-114-0051-0060.txt", rawHeadword: "pontík" },
    { headword: "phóti", page: 120, line: 64, filename: "bashir-120-0061-0067.txt" },
    { headword: "phuṣ", page: 121, line: 61, filename: "bashir-121-0061-0067.txt" },
    { headword: "qop dik", page: 123, line: 57, filename: "bashir-123-0051-0060.txt" },
    { headword: "saʋá", page: 130, line: 65, filename: "bashir-130-0061-0068.txt" },
    { headword: "šahín", page: 134, line: 62, filename: "bashir-134-0061-0064.txt" },
    { headword: "šetú", page: 136, line: 58, filename: "bashir-136-0051-0060.txt" },
    { headword: "širístu", page: 137, line: 75, filename: "bashir-137-0071-0077.txt" },
    { headword: "šuṭánsk", page: 139, line: 61, filename: "bashir-139-0061-0063.txt", neighbor: "šunǰmúk" },
    { headword: "tay", page: 144, line: 57, filename: "bashir-144-0051-0060.txt" },
    { headword: "ton", page: 145, line: 65, filename: "bashir-145-0061-0068.txt" },
    { headword: "thundást", page: 149, line: 65, filename: "bashir-149-0061-0067.txt" },
    { headword: "tsirirí", page: 150, line: 61, filename: "bashir-150-0061-0065.txt" },
    { headword: "ṭareék", page: 151, line: 61, filename: "bashir-151-0061-0070.txt" },
    { headword: "ṭhongí", page: 153, line: 54, filename: "bashir-153-0051-0059.txt" },
    { headword: "ʋrenǰík", page: 161, line: 60, filename: "bashir-161-0051-0060.txt" },
    { headword: "xap", page: 162, line: 68, filename: "bashir-162-0061-0070.txt", neighbor: "xalí" },
    { headword: "dreék", page: 167, line: 52, filename: "bashir-167-0051-0060.txt" },
    { headword: "ẓukúni", page: 172, line: 59, filename: "bashir-172-0051-0060.txt" },
  ];

  for (const item of confirmed) {
    const matchesSource = (candidate: (typeof report.entries)[number]) => candidate.headword === item.headword
      && candidate.pdfPage === item.page
      && candidate.sourceLineStart === item.line
      && candidate.column === 2;
    const entry = report.entries.find(matchesSource);
    const repeated = repeatedReport.entries.find(matchesSource);
    assert.ok(entry, `missing ${item.headword}`);
    assert.equal(entry.pdfPage, item.page);
    assert.equal(entry.sourceLineStart, item.line);
    assert.equal(entry.column, 2);
    assert.ok(entry.provenance.crossColumnContinuationCandidate, `${item.headword} handoff retained`);
    assert.equal(entry.sourceEntryId, repeated?.sourceEntryId, `${item.headword} stable source identity`);
    assert.match(entry.rawSourceExcerpt, new RegExp(item.headword, "u"));
    if (item.neighbor) {
      const neighboringEntry = report.entries.find((candidate) => candidate.headword === item.neighbor
        && candidate.pdfPage === item.page
        && candidate.column === 1);
      assert.ok(neighboringEntry, `neighbor ${item.neighbor} remains present`);
      assert.equal(neighboringEntry.column, 1);
      assert.equal(neighboringEntry.pdfPage, item.page);
      const neighboringRows = neighboringEntry.provenance.rawPhysicalSourceLines as Array<{
        pdfPage: number;
        sourceLine: number;
        column: number;
      }>;
      assert.ok(neighboringRows.some((row) => row.pdfPage === item.page && row.sourceLine === item.line && row.column === 1));
    }

    const physicalRows = entry.provenance.rawPhysicalSourceLines as Array<{
      filename: string;
      pdfPage: number;
      sourceLine: number;
      column: number;
      columnText: string;
      raw: string;
    }>;
    assert.ok(physicalRows.some((row) => row.filename === item.filename && row.pdfPage === item.page && row.sourceLine === item.line));
    assert.ok(physicalRows.every((row) => row.column === 2));
    assert.equal(entry.rawSourceExcerpt, physicalRows.map((row) => row.columnText).join("\n"));
    const firstRow = physicalRows.find((row) => row.filename === item.filename && row.sourceLine === item.line);
    assert.ok(firstRow);
    assert.match(firstRow.raw, new RegExp(item.rawHeadword ?? item.headword, "u"));
  }

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
  assert.equal(report.entries.find((entry) => entry.headword === "right")?.ambiguous, true);
});