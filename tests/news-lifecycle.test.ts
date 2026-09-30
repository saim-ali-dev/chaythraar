import assert from "node:assert/strict";
import test from "node:test";
import {
  deduplicateNewsItems,
  hasGeneratedNewsSummary,
  hasMaterialNewsChange,
  isNewsWithinActiveWindow,
  NEWS_ACTIVE_WINDOW_MS,
  selectTopNewsItems,
} from "@/lib/news/lifecycle";
import {
  ingestNewsSources,
  type ExistingNewsRow,
  type NewsIngestionOptions,
  type NewsIngestionRepository,
} from "@/lib/news/ingest";
import type { NormalizedNewsItem, NewsSourceAdapter } from "@/lib/news/types";
import type { NewsSummarizationInput, NewsSummarizationResult } from "@/lib/news/summarize-core";
import type { Database } from "@/lib/supabase/database.types";

const NOW = new Date("2026-09-30T12:00:00.000Z");
type NewsInsert = Database["public"]["Tables"]["news"]["Insert"];
type NewsUpdate = Parameters<NewsIngestionRepository["update"]>[1];

test("the 48-hour active boundary is inclusive in UTC", () => {
  const boundary = new Date(NOW.getTime() - NEWS_ACTIVE_WINDOW_MS).toISOString();
  const inside = new Date(Date.parse(boundary) + 1).toISOString();
  const outside = new Date(Date.parse(boundary) - 1).toISOString();

  assert.equal(isNewsWithinActiveWindow(boundary, NOW), true);
  assert.equal(isNewsWithinActiveWindow(inside, NOW), true);
  assert.equal(isNewsWithinActiveWindow(outside, NOW), false);
  assert.equal(isNewsWithinActiveWindow("not-a-date", NOW), false);
});

test("deduplication removes same-source URL repeats but preserves another source", () => {
  const first = makeItem("https://example.test/story");
  const repeated = { ...first, title: "Duplicate feed copy" };
  const otherSource = makeItem(first.source_url, { source: "ChitralToday" });
  const result = deduplicateNewsItems([first, repeated, otherSource]);

  assert.equal(result.duplicates, 1);
  assert.deepEqual(result.items, [first, otherSource]);
});

test("material update detection ignores whitespace but catches source changes", () => {
  const item = makeItem("https://example.test/story");
  const existing = makeExisting(item);
  const whitespaceOnly = makeItem(item.source_url, {
    title: "  Example   story ",
    summary: "  A source\nexcerpt.  ",
    category: " News  ",
    original_language: " en ",
  });

  assert.equal(hasMaterialNewsChange(existing, whitespaceOnly), false);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { title: "Updated story" })), true);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { summary: "A materially different excerpt." })), true);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { category: "Local News" })), true);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { original_language: "ur" })), true);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { published_at: "2026-09-30T11:00:00.000Z" })), true);
  assert.equal(hasMaterialNewsChange(existing, makeItem(item.source_url, { published_at: "2026-09-30T12:00:00+00:00" })), false);
});

test("top-ten ordering is newest first with URL tie-breaks and allows fewer than ten", () => {
  const tied = [
    makeItem("https://example.test/z", { published_at: NOW.toISOString() }),
    makeItem("https://example.test/a", { published_at: NOW.toISOString() }),
  ];
  const ranked = selectTopNewsItems(tied);

  assert.deepEqual(ranked.map((item) => item.source_url), ["https://example.test/a", "https://example.test/z"]);
  assert.equal(selectTopNewsItems(tied, 10).length, 2);
  assert.equal(hasGeneratedNewsSummary({ headline: " ", summary_short: "Summary" }), false);
});

test("repeat ingestion reuses completed summaries and updates material changes in place", async () => {
  const repository = new MemoryNewsRepository();
  const calls: string[] = [];
  const summarize = async (input: NewsSummarizationInput) => {
    calls.push(input.originalTitle);
    return summaryFor(input);
  };
  const options = makeOptions(repository, summarize);
  const item = makeItem("https://example.test/story");
  const source = makeAdapter("Chitral Times", [item]);

  const first = await ingestNewsSources([source], options);
  const repeated = await ingestNewsSources([source], options);
  const whitespaceOnly = await ingestNewsSources([
    makeAdapter("Chitral Times", [makeItem(item.source_url, {
      title: "  Example   story ",
      summary: "  A source\nexcerpt.  ",
    })]),
  ], options);
  const changed = await ingestNewsSources([
    makeAdapter("Chitral Times", [makeItem(item.source_url, { summary: "A changed source excerpt." })]),
  ], options);

  assert.equal(first.inserted, 1);
  assert.equal(first.summarized, 1);
  assert.equal(repeated.unchanged, 1);
  assert.equal(repeated.reused, 1);
  assert.equal(repeated.inserted, 0);
  assert.equal(whitespaceOnly.unchanged, 1);
  assert.equal(whitespaceOnly.reused, 1);
  assert.equal(changed.updated, 1);
  assert.equal(changed.updatedRows, 1);
  assert.equal(changed.inserted, 0);
  assert.equal(calls.length, 2);
  assert.equal(repository.rows.length, 1);
  assert.equal(repository.rows[0].summary, "A changed source excerpt.");
  assert.equal(repository.rows[0].headline, "Generated: Example story");
});

test("an unchanged selected row missing generated fields is summarized without reinsertion", async () => {
  const repository = new MemoryNewsRepository();
  const item = makeItem("https://example.test/missing-summary");
  const existing = makeExisting(item);
  existing.headline = null;
  existing.summary_short = null;
  repository.rows.push(existing);
  let summaryCalls = 0;

  const report = await ingestNewsSources(
    [makeAdapter("Chitral Times", [item])],
    makeOptions(repository, async (input) => {
      summaryCalls += 1;
      return summaryFor(input);
    }),
  );

  assert.equal(report.unchanged, 1);
  assert.equal(report.selected, 1);
  assert.equal(report.summarized, 1);
  assert.equal(report.inserted, 0);
  assert.equal(report.updatedRows, 1);
  assert.equal(summaryCalls, 1);
  assert.equal(repository.rows.length, 1);
  assert.equal(repository.rows[0].headline, "Generated: Example story");
});

test("a changed candidate outside the top ten is updated and invalidated without summarization", async () => {
  const repository = new MemoryNewsRepository();
  const oldItem = makeItem("https://example.test/old-candidate", {
    title: "Older candidate",
    published_at: new Date(NOW.getTime() - 10 * 60_000).toISOString(),
  });
  const existing = makeExisting(oldItem);
  repository.rows.push(existing);
  const changedItem = { ...oldItem, summary: "Updated source excerpt." };
  const newerItems = Array.from({ length: 10 }, (_, index) => makeItem(
    `https://example.test/newer-${index}`,
    {
      title: `Newer candidate ${index}`,
      published_at: new Date(NOW.getTime() - index * 60_000).toISOString(),
    },
  ));
  const summarizedTitles: string[] = [];

  const report = await ingestNewsSources(
    [makeAdapter("Chitral Times", [...newerItems, changedItem])],
    makeOptions(repository, async (input) => {
      summarizedTitles.push(input.originalTitle);
      return summaryFor(input);
    }),
  );

  assert.equal(report.updated, 1);
  assert.equal(report.selected, 10);
  assert.equal(report.not_selected, 1);
  assert.equal(report.summarized, 10);
  assert.equal(report.updatedRows, 1);
  assert.equal(summarizedTitles.includes("Older candidate"), false);
  assert.equal(repository.rows.length, 11);
  const storedChanged = repository.rows.find((row) => row.id === existing.id);
  assert.equal(storedChanged?.summary, "Updated source excerpt.");
  assert.equal(storedChanged?.headline, null);
  assert.equal(storedChanged?.summary_short, null);
});

test("only the ten newest recent candidates are summarized and stored", async () => {
  const repository = new MemoryNewsRepository();
  let summaryCalls = 0;
  const summarize = async (input: NewsSummarizationInput) => {
    summaryCalls += 1;
    return summaryFor(input);
  };
  const recent = Array.from({ length: 12 }, (_, index) => makeItem(
    `https://example.test/${index}`,
    { published_at: new Date(NOW.getTime() - index * 60_000).toISOString() },
  ));
  const old = makeItem("https://example.test/old", {
    published_at: new Date(NOW.getTime() - NEWS_ACTIVE_WINDOW_MS - 1).toISOString(),
  });
  const report = await ingestNewsSources(
    [makeAdapter("Chitral Times", [...recent, old])],
    makeOptions(repository, summarize),
  );

  assert.equal(report.fetched, 13);
  assert.equal(report.recent, 12);
  assert.equal(report.selected, 10);
  assert.equal(report.not_selected, 2);
  assert.equal(report.skipped, 1);
  assert.equal(report.summarized, 10);
  assert.equal(summaryCalls, 10);
  assert.equal(report.inserted, 10);
  assert.equal(repository.rows.length, 10);
  assert.equal(repository.rows.some((row) => row.source_url === old.source_url), false);
});

test("the same URL from two sources remains two records", async () => {
  const repository = new MemoryNewsRepository();
  const url = "https://example.test/shared-story";
  const report = await ingestNewsSources([
    makeAdapter("Chitral Times", [makeItem(url, { source: "Chitral Times" })]),
    makeAdapter("ChitralToday", [makeItem(url, { source: "ChitralToday" })]),
  ], makeOptions(repository));

  assert.equal(report.duplicates, 0);
  assert.equal(report.inserted, 2);
  assert.deepEqual(repository.rows.map((row) => row.source).sort(), ["Chitral Times", "ChitralToday"]);
});

test("a failed summary still inserts source metadata with retryable null fields", async () => {
  const repository = new MemoryNewsRepository();
  const item = makeItem("https://example.test/summary-failure");
  const report = await ingestNewsSources(
    [makeAdapter("Chitral Times", [item])],
    makeOptions(repository, async () => { throw new Error("provider unavailable"); }),
  );

  assert.equal(report.failed, 1);
  assert.equal(report.summarization_failed, 1);
  assert.equal(report.inserted, 1);
  assert.equal(repository.rows[0].source_url, item.source_url);
  assert.equal(repository.rows[0].title, item.title);
  assert.equal(repository.rows[0].headline, null);
  assert.equal(repository.rows[0].summary_short, null);
});

test("one source fetch failure does not prevent the other source", async () => {
  const repository = new MemoryNewsRepository();
  const goodItem = makeItem("https://example.test/available");
  const failedAdapter: NewsSourceAdapter = {
    name: "Unavailable source",
    fetchItems: async () => { throw new Error("feed unavailable"); },
    normalizeItem: () => null,
  };
  const report = await ingestNewsSources([
    failedAdapter,
    makeAdapter("Chitral Times", [goodItem]),
  ], makeOptions(repository));

  assert.equal(report.failed, 1);
  assert.equal(report.inserted, 1);
  assert.equal(repository.rows[0].source_url, goodItem.source_url);
});

function makeOptions(
  repository: MemoryNewsRepository,
  summarize: NonNullable<NewsIngestionOptions["summarize"]> = summaryFor,
): NewsIngestionOptions {
  return {
    now: NOW,
    repository,
    summarizationConfigured: true,
    summarize,
  };
}

function makeAdapter(name: string, items: NormalizedNewsItem[]): NewsSourceAdapter {
  return {
    name,
    fetchItems: async () => items,
    normalizeItem: (raw) => raw as NormalizedNewsItem,
  };
}

function makeItem(sourceUrl: string, overrides: Partial<NormalizedNewsItem> = {}): NormalizedNewsItem {
  const title = overrides.title ?? "Example story";
  return {
    title,
    summary: "A source excerpt.",
    headline: null,
    summary_short: null,
    original_title: title,
    original_language: "en",
    source: "Chitral Times",
    source_url: sourceUrl,
    image_url: null,
    published_at: NOW.toISOString(),
    category: "News",
    ...overrides,
  };
}

function makeExisting(item: NormalizedNewsItem): ExistingNewsRow {
  return {
    id: "existing-id",
    title: item.title,
    summary: item.summary,
    source: item.source,
    source_url: item.source_url,
    headline: "Stored headline",
    summary_short: "Stored summary",
    original_title: item.original_title,
    original_language: item.original_language,
    category: item.category,
    published_at: item.published_at,
  };
}

async function summaryFor(input: NewsSummarizationInput): Promise<NewsSummarizationResult> {
  return {
    headline: `Generated: ${input.originalTitle.trim()}`,
    summary_short: "A concise generated summary.",
    original_language: input.originalLanguage,
  };
}

class MemoryNewsRepository implements NewsIngestionRepository {
  readonly rows: ExistingNewsRow[] = [];
  private nextId = 1;

  async listBySource(source: string, sourceUrls: string[]) {
    const urlSet = new Set(sourceUrls);
    return {
      rows: this.rows.filter((row) => row.source === source && row.source_url !== null && urlSet.has(row.source_url)),
      error: null,
    };
  }

  async insert(rows: NewsInsert[]) {
    for (const row of rows) {
      this.rows.push({
        id: `news-${this.nextId++}`,
        title: row.title,
        summary: row.summary,
        source: row.source,
        source_url: row.source_url,
        headline: row.headline,
        summary_short: row.summary_short,
        original_title: row.original_title,
        original_language: row.original_language,
        category: row.category,
        published_at: row.published_at,
      });
    }
    return { inserted: rows.length, error: null };
  }

  async update(id: string, values: NewsUpdate) {
    const index = this.rows.findIndex((row) => row.id === id);
    if (index < 0) return { error: "row not found" };
    this.rows[index] = { ...this.rows[index], ...values };
    return { error: null };
  }
}