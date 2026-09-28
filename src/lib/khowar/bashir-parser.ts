import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const COLUMN_START = 68;
const DICTIONARY_START_PAGE = 14;
const POS = "(?:n|adj|adv|vtr|vintr|vcs|pro|conjunction|interjection|postposition|noun|verb transitive|verb intransitive)";
const CONFIRMED_COLUMN_RESOLUTIONS = new Map<string, { column: 1 | 2; headword?: string; split?: number }>([
  ["18:24", { column: 2, headword: "ka", split: 61 }],
  ["18:57", { column: 1 }],
  ["68:34", { column: 1 }],
  ["68:44", { column: 1 }],
]);

export type BashirFragment = {
  filename: string;
  page: number;
  lineStart: number;
  lineEnd: number;
  text: string;
};

type SourceLine = {
  page: number;
  line: number;
  filename: string;
  raw: string;
  column: 1 | 2;
  text: string;
  layoutAmbiguous: boolean;
  pageFurniture: boolean;
};

export type BashirPageFurnitureLine = {
  filename: string;
  page: number;
  line: number;
  raw: string;
};

export type BashirSubentry = {
  headword: string;
  partOfSpeech: string[];
  gloss: string;
  page: number;
  line: number;
  sourceFilename: string;
  alternatePronunciation: string | null;
};

export type BashirEntry = {
  sourceEntryId: string;
  headword: string;
  partOfSpeech: string[];
  englishGloss: string | null;
  englishDefinition: string | null;
  kind: "top-level";
  subentries: BashirSubentry[];
  page: number;
  pdfPage: number;
  column: 1 | 2;
  sourceLineStart: number;
  sourceLineEnd: number;
  originalChunkFilenames: string[];
  rawSourceExcerpt: string;
  provenance: Record<string, unknown>;
  ambiguous: boolean;
  malformed: boolean;
};

export type BashirParseReport = {
  entries: BashirEntry[];
  pageFurnitureLines: BashirPageFurnitureLine[];
  ambiguousEntries: BashirEntry[];
  malformedEntries: BashirEntry[];
  subentryCount: number;
  entriesSpanningFragments: number;
  entriesSpanningPdfPages: number;
  entriesWithAlternatePronunciations: number;
  entriesWithEtymology: number;
  entriesWithSourceMarkers: number;
  ambiguousLayoutLines: number;
};

export function readBashirFragments(directory: string): BashirFragment[] {
  const fragments = readdirSync(directory)
    .map((filename) => {
      const match = /^bashir-(\d+)-(\d+)-(\d+)\.txt$/u.exec(filename);
      if (!match) return null;
      return {
        filename,
        page: Number(match[1]),
        lineStart: Number(match[2]),
        lineEnd: Number(match[3]),
        text: readFileSync(join(directory, filename), "utf8"),
      } satisfies BashirFragment;
    })
    .filter((fragment): fragment is BashirFragment => fragment !== null)
    .sort((left, right) => left.page - right.page || left.lineStart - right.lineStart || left.lineEnd - right.lineEnd);

  if (fragments.length === 0) throw new Error(`No Bashir fragments found in ${directory}.`);
  return fragments;
}

export function parseBashirFragments(fragments: BashirFragment[]): BashirParseReport {
  const sorted = [...fragments].sort((left, right) => left.page - right.page || left.lineStart - right.lineStart);
  const sourceLines = makeSourceLines(sorted);
  const pageFurnitureLines = sourceLines
    .filter((line) => line.column === 1 && line.pageFurniture)
    .map(({ filename, page, line, raw }) => ({ filename, page, line, raw }));
  const candidates: Candidate[] = [];
  for (const column of [1, 2] as const) {
    const columnLines = sourceLines.filter((line) => line.column === column && line.page >= DICTIONARY_START_PAGE);
    candidates.push(...findCandidates(columnLines, column));
  }
  candidates.sort((left, right) => left.line.page - right.line.page
    || left.line.line - right.line.line
    || left.column - right.column
    || left.offset - right.offset);

  const entries: BashirEntry[] = [];
  const activeByColumn = new Map<1 | 2, BashirEntry>();
  for (const candidate of candidates) {
    let active = activeByColumn.get(candidate.column);
    if (candidate.subentry && active) {
      active.subentries.push({
        headword: candidate.headword,
        partOfSpeech: candidate.partOfSpeech,
        gloss: candidate.gloss,
        page: candidate.line.page,
        line: candidate.line.line,
        sourceFilename: candidate.line.filename,
        alternatePronunciation: candidate.alternatePronunciation,
      });
      active.ambiguous ||= candidate.ambiguous;
      continue;
    }

    if (candidate.kind === "subentry") continue;
    active = {
      sourceEntryId: makeSourceEntryId(candidate.line.page, candidate.column, candidate.line.line),
      headword: candidate.headword,
      partOfSpeech: candidate.partOfSpeech,
      englishGloss: candidate.gloss || null,
      englishDefinition: null,
      kind: "top-level",
      subentries: [],
      page: candidate.line.page,
      pdfPage: candidate.line.page,
      column: candidate.column,
      sourceLineStart: candidate.line.line,
      sourceLineEnd: candidate.line.line,
      originalChunkFilenames: [],
      rawSourceExcerpt: "",
      provenance: {},
      ambiguous: candidate.ambiguous,
      malformed: candidate.malformed,
    };
    entries.push(active);
    activeByColumn.set(candidate.column, active);
  }

  for (const [index, entry] of entries.entries()) {
    const next = entries.slice(index + 1).find((candidate) => candidate.column === entry.column);
    const entryLines = sourceLines.filter((line) => line.column === entry.column
      && !line.pageFurniture
      && line.text.trim().length > 0
      && (line.page > entry.page || (line.page === entry.page && line.line >= entry.sourceLineStart))
      && (!next || line.page < next.page || (line.page === next.page && line.line < next.sourceLineStart)));
    const filenames = unique(entryLines.map((line) => line.filename));
    const pages = unique(entryLines.map((line) => line.page));
    const crossColumnContinuationCandidate = findCrossColumnContinuation(entry, entryLines, sourceLines);
    const rawPhysicalSourceLines = entryLines.map((line) => ({
      filename: line.filename,
      pdfPage: line.page,
      sourceLine: line.line,
      column: line.column,
      columnText: line.text,
      raw: line.raw,
    }));
    entry.sourceLineEnd = Math.max(entry.sourceLineStart, ...entryLines.map((line) => line.line));
    entry.originalChunkFilenames = filenames;
    entry.rawSourceExcerpt = entryLines.map((line) => line.text).join("\n");
    entry.ambiguous ||= entryLines.some((line) => line.layoutAmbiguous);
    entry.ambiguous ||= crossColumnContinuationCandidate !== null;
    entry.provenance = {
      source: "Elena Bashir, A Khowar-English glossary [HL Archive 12]",
      page: entry.page,
      pdfPage: entry.pdfPage,
      column: entry.column,
      columnResolution: CONFIRMED_COLUMN_RESOLUTIONS.get(`${entry.page}:${entry.sourceLineStart}`) ?? null,
      sourceLineStart: entry.sourceLineStart,
      sourceLineEnd: entry.sourceLineEnd,
      originalChunkFilenames: filenames,
      rawSourceExcerpt: entry.rawSourceExcerpt,
      rawPhysicalSourceLines,
      sourceLineSpans: getSourceLineSpans(entryLines),
      partOfSpeech: entry.partOfSpeech,
      subentries: entry.subentries,
      pagesSpanned: pages,
      crossColumnContinuationCandidate,
      alternatePronunciations: /\/\s*other\s+pronunc/iu.test(entry.rawSourceExcerpt),
      pronunciationDetails: extractPronunciations(entry.rawSourceExcerpt),
      etymology: /\[\s*<|\(\s*<|\betymology\b/iu.test(entry.rawSourceExcerpt),
      etymologyDetails: extractEtymologies(entry.rawSourceExcerpt),
      sourceMarkers: /\{[^}]+\}|\(MNN\)|\(SWKA\)/u.test(entry.rawSourceExcerpt),
      sourceMarkerDetails: extractSourceMarkers(entry.rawSourceExcerpt),
      layoutAmbiguous: entry.ambiguous,
    };
  }

  const entriesWith = (field: "alternatePronunciations" | "etymology" | "sourceMarkers") =>
    entries.filter((entry) => entry.provenance[field] === true).length;
  return {
    entries,
    pageFurnitureLines,
    ambiguousEntries: entries.filter((entry) => entry.ambiguous),
    malformedEntries: entries.filter((entry) => entry.malformed),
    subentryCount: entries.reduce((count, entry) => count + entry.subentries.length, 0),
    entriesSpanningFragments: entries.filter((entry) => entry.originalChunkFilenames.length > 1).length,
    entriesSpanningPdfPages: entries.filter((entry) => (entry.provenance.pagesSpanned as number[]).length > 1).length,
    entriesWithAlternatePronunciations: entriesWith("alternatePronunciations"),
    entriesWithEtymology: entriesWith("etymology"),
    entriesWithSourceMarkers: entriesWith("sourceMarkers"),
    ambiguousLayoutLines: sourceLines.filter((line) => line.layoutAmbiguous && !line.pageFurniture).length,
  };
}

export function parseBashirDirectory(directory: string): BashirParseReport {
  return parseBashirFragments(readBashirFragments(directory));
}

type Candidate = {
  headword: string;
  partOfSpeech: string[];
  gloss: string;
  line: SourceLine;
  column: 1 | 2;
  kind: "top-level" | "subentry";
  subentry: boolean;
  ambiguous: boolean;
  malformed: boolean;
  offset: number;
  alternatePronunciation: string | null;
};

function makeSourceLines(fragments: BashirFragment[]): SourceLine[] {
  const sourceLines: SourceLine[] = [];
  const pageSplits = inferPageColumnSplits(fragments);
  for (const fragment of fragments) {
    const rows = fragment.text.replace(/\r\n?/gu, "\n").split("\n");
    if (rows.at(-1) === "") rows.pop();
    for (const [offset, raw] of rows.entries()) {
      const line = fragment.lineStart + offset;
      if (line > fragment.lineEnd) break;
      const pageFurniture = /Bashir, Khowar-English Lexicon/u.test(raw);
      const recognizedSplit = findColumnSplit(raw);
      const split = resolveColumnSplit(raw, fragment.page, line, recognizedSplit, pageSplits);
      const left = raw.slice(0, split);
      const right = raw.slice(split);
      const hasLeft = left.trim().length > 0;
      const hasRight = right.trim().length > 0;
      const boundary = raw.slice(COLUMN_START - 8, COLUMN_START + 8);
      for (const [column, text] of [[1, left], [2, right]] as const) {
        const confirmedResolution = CONFIRMED_COLUMN_RESOLUTIONS.get(`${fragment.page}:${line}`);
        const layoutAmbiguous = !pageFurniture && !confirmedResolution
          && split === COLUMN_START && hasLeft && hasRight && !/\s{2,}/u.test(boundary);
        sourceLines.push({ page: fragment.page, line, filename: fragment.filename, raw, column, text, layoutAmbiguous, pageFurniture });
      }
    }
  }
  return sourceLines;
}

function inferPageColumnSplits(fragments: BashirFragment[]): Map<number, number> {
  const counts = new Map<number, Map<number, number>>();
  for (const fragment of fragments) {
    const rows = fragment.text.replace(/\r\n?/gu, "\n").split("\n");
    for (const raw of rows) {
      if (/Bashir, Khowar-English Lexicon/u.test(raw)) continue;
      const split = findColumnSplit(raw);
      if (split === COLUMN_START) continue;
      const positions = counts.get(fragment.page) ?? new Map<number, number>();
      positions.set(split, (positions.get(split) ?? 0) + 1);
      counts.set(fragment.page, positions);
    }
  }

  const inferred = new Map<number, number>();
  for (const [page, positions] of counts) {
    const [position, count] = [...positions.entries()].sort((left, right) => right[1] - left[1] || left[0] - right[0])[0] ?? [];
    if (position !== undefined && count >= 3) inferred.set(page, position);
  }
  return inferred;
}

function resolveColumnSplit(
  raw: string,
  page: number,
  line: number,
  recognizedSplit: number,
  pageSplits: Map<number, number>,
): number {
  const confirmedResolution = CONFIRMED_COLUMN_RESOLUTIONS.get(`${page}:${line}`);
  if (confirmedResolution?.split !== undefined) return confirmedResolution.split;
  if (recognizedSplit !== COLUMN_START || confirmedResolution) return recognizedSplit;

  const inferredSplit = pageSplits.get(page);
  if (inferredSplit === undefined) return recognizedSplit;
  const gutterAtSplit = [...raw.matchAll(/\s{3,}/gu)].some((match) => {
    const start = match.index ?? 0;
    return start + match[0].length === inferredSplit;
  });
  return gutterAtSplit && raw.slice(inferredSplit).trim().length > 0 ? inferredSplit : recognizedSplit;
}

function findCandidates(lines: SourceLine[], column: 1 | 2): Candidate[] {
  const candidates: Candidate[] = [];
  let activeHeadword: string | null = null;
  let pendingPronunciation: Candidate | null = null;
  for (const line of lines) {
    if (line.pageFurniture) continue;
    const trimmed = line.text.trimStart();
    if (!trimmed) continue;
    if (pendingPronunciation && /^[‘'“]/u.test(trimmed)) {
      pendingPronunciation.gloss = extractQuotedText(trimmed);
      pendingPronunciation = null;
    }
    const indentation = line.text.length - trimmed.length;
      const local = extractPosCandidates(trimmed, line, column);
    for (const candidate of local) {
        const atMargin = candidate.offset === 0;
      const related = activeHeadword !== null && isDerivedFrom(candidate.headword, activeHeadword);
        const subentry = !atMargin && (related || Boolean(activeHeadword));
      if (!atMargin && !subentry) continue;
      candidate.kind = subentry ? "subentry" : "top-level";
      candidate.subentry = subentry;
      candidates.push(candidate);
      if (!subentry) activeHeadword = candidate.headword;
    }

    if (indentation <= 7) {
      const suffix = /^(-\S+)\s+(.*)$/u.exec(trimmed);
      const hasPosBearingCandidate = suffix
        && local.some((candidate) => candidate.offset === 0
          && candidate.headword === suffix[1]
          && candidate.partOfSpeech.length > 0);
      if (suffix && !hasPosBearingCandidate && /['‘“]|\bcase ending\b/iu.test(suffix[2])) {
        candidates.push({
          headword: suffix[1], partOfSpeech: [], gloss: extractQuotedText(suffix[2]), line, column,
          kind: "top-level", subentry: false, ambiguous: line.layoutAmbiguous, malformed: false, offset: 0, alternatePronunciation: null,
        });
        activeHeadword = suffix[1];
      }
    }

    const pronunciationHeadword = /([\p{L}\p{M}\d-]+)\s+\/(?:other(?:\s+pronunc)?|pronunc)?\s*$/iu.exec(trimmed);
    if (pronunciationHeadword && activeHeadword) {
      pendingPronunciation = {
        headword: pronunciationHeadword[1], partOfSpeech: [], gloss: "", line, column,
        kind: "subentry", subentry: true, ambiguous: line.layoutAmbiguous, malformed: false, offset: 0,
        alternatePronunciation: pronunciationHeadword[0],
      };
      candidates.push(pendingPronunciation);
    }
  }
  return candidates;
}

function extractPosCandidates(text: string, line: SourceLine, column: 1 | 2): Array<Candidate & { offset: number }> {
  const candidates: Array<Candidate & { offset: number }> = [];
  const pronunciation = String.raw`(?:\/\s*(?:other\s+)?pronunc[^/]*\/\s*)?`;
  const pattern = new RegExp(`([\\p{L}\\p{M}\\d-]+(?:\\s+[\\p{L}\\p{M}\\d-]+)*)\\s+(${pronunciation})\\((${POS}(?:\\s*,\\s*${POS})*)\\)\\s+([‘'“])([^\\n]*?)(?:[’'”]|$)`, "giu");
  for (const match of text.matchAll(pattern)) {
    const offset = match.index ?? 0;
    const alternatePronunciation = match[2].trim() || null;
    const pos = match[3].trim();
    const resolution = CONFIRMED_COLUMN_RESOLUTIONS.get(`${line.page}:${line.line}`);
    if (resolution && resolution.column !== column) continue;
    const headword = resolution?.headword ?? match[1].trim().replace(/\s+\/$/u, "");
    candidates.push({
      headword,
      partOfSpeech: pos.split(/\s*,\s*/u),
      gloss: match[5].trim(),
      line, column,
      kind: "top-level", subentry: false,
      ambiguous: line.layoutAmbiguous,
      malformed: !headword || !match[5].trim(),
      offset,
      alternatePronunciation,
    });
  }
  return candidates;
}

function findColumnSplit(line: string): number {
  const gutter = /\s{3,}/gu;
  const pronunciation = String.raw`(?:\s+\/\s*(?:other\s+)?pronunc[^/]*\/)?`;
  const rightEntry = new RegExp(`^(?:[\\p{L}\\p{M}\\d-]+(?:\\s+[\\p{L}\\p{M}\\d-]+)*${pronunciation}\\s+\\(\\s*${POS}|-\\S+\\s+/(?:other|pronunc))`, "iu");
  for (const match of line.matchAll(gutter)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start >= 5 && end >= 50 && end <= 90 && rightEntry.test(line.slice(end).trimStart())) return end;
  }
  return COLUMN_START;
}

function getSourceLineSpans(lines: SourceLine[]) {
  const spans = new Map<string, { pdfPage: number; sourceLineStart: number; sourceLineEnd: number }>();
  for (const line of lines) {
    const span = spans.get(line.filename);
    if (span) span.sourceLineEnd = Math.max(span.sourceLineEnd, line.line);
    else spans.set(line.filename, { pdfPage: line.page, sourceLineStart: line.line, sourceLineEnd: line.line });
  }
  return [...spans.entries()].map(([filename, span]) => ({ filename, ...span }));
}

function findCrossColumnContinuation(entry: BashirEntry, entryLines: SourceLine[], sourceLines: SourceLine[]) {
  if (entry.column !== 2) return null;
  const pages = unique(entryLines.map((line) => line.page));
  const finalPage = pages.at(-1);
  if (finalPage === undefined) return null;
  const lastLine = entryLines.filter((line) => line.page === finalPage).at(-1);
  if (!lastLine || /[.!?][’'”)]?\s*$/u.test(lastLine.text.trim())) return null;
  if (sourceLines.some((line) => line.page === finalPage
    && line.column === entry.column
    && !line.pageFurniture
    && line.text.trim().length > 0
    && line.line > lastLine.line)) return null;

  const nextColumnLine = sourceLines.find((line) => line.page === finalPage + 1
    && line.column === 1
    && !line.pageFurniture
    && line.text.trim().length > 0);
  if (!nextColumnLine) return null;
  const nextText = nextColumnLine.text.trimStart();
  if (extractPosCandidates(nextText, nextColumnLine, nextColumnLine.column).some((candidate) => candidate.offset === 0)) return null;

  return {
    page: nextColumnLine.page,
    sourceLine: nextColumnLine.line,
    sourceFilename: nextColumnLine.filename,
    column: nextColumnLine.column,
    rawSourceExcerpt: nextColumnLine.raw,
  };
}

function extractPronunciations(text: string): string[] {
  return [...text.matchAll(/\/\s*(?:other\s+)?pronunc[^\/]*\//gu)].map((match) => match[0]);
}

function extractEtymologies(text: string): string[] {
  return [...text.matchAll(/\[\s*<[^\]]+\]|\(\s*<[^)]+\)/gu)].map((match) => match[0]);
}

function extractSourceMarkers(text: string): string[] {
  return [...text.matchAll(/\{[^}]+\}/gu)].map((match) => match[0]);
}

function isDerivedFrom(candidate: string, parent: string): boolean {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[¹²³⁴⁵⁶⁷⁸⁹0-9]/gu, "").replace(/[^\p{L}\p{M}]/gu, "");
  const root = normalize(parent);
  const form = normalize(candidate);
  if (/\d$/u.test(candidate) && root === form.replace(/\d+$/u, "")) return false;
  return root.length >= 2 && form.length > root.length && form.startsWith(root);
}

function extractQuotedText(value: string): string {
  return /[‘'“]([^’'”]+)[’'”]/u.exec(value)?.[1]?.trim() ?? value.trim();
}

function makeSourceEntryId(page: number, column: 1 | 2, line: number): string {
  const digest = createHash("sha256").update(`bashir-2023\u0000${page}\u0000${column}\u0000${line}`).digest("hex").slice(0, 24);
  return `bashir-2023-${digest}`;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function findBashirEntry(report: BashirParseReport, headword: string): BashirEntry | undefined {
  return report.entries.find((entry) => entry.headword === headword)
    ?? report.entries.find((entry) => entry.subentries.some((subentry) => subentry.headword === headword));
}