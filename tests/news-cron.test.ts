import assert from "node:assert/strict";
import test from "node:test";
import { handleNewsIngestionCron } from "@/lib/news/cron";
import type { NewsIngestionReport } from "@/lib/news/types";

function makeReport(overrides: Partial<NewsIngestionReport> = {}): NewsIngestionReport {
  return {
    fetched: 4,
    discovered: 4,
    normalized: 4,
    recent: 4,
    filtered: 0,
    new: 2,
    updated: 0,
    unchanged: 2,
    selected: 2,
    not_selected: 2,
    already_existing: 2,
    inserted: 2,
    updatedRows: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    summarized: 2,
    summarization_skipped: 0,
    summarization_failed: 0,
    reused: 0,
    ...overrides,
  };
}

function makeLogger() {
  const entries: unknown[][] = [];
  return {
    entries,
    logger: {
      info: (...values: unknown[]) => entries.push(values),
      error: (...values: unknown[]) => entries.push(values),
    },
  };
}

test("news cron rejects missing or incorrect Bearer authorization", async () => {
  const { entries, logger } = makeLogger();
  let ingestCalls = 0;
  const ingest = async () => {
    ingestCalls += 1;
    return makeReport();
  };

  const missing = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news"), "secret", ingest, logger);
  const unconfigured = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news", {
    headers: { authorization: "Bearer secret" },
  }), undefined, ingest, logger);
  const incorrect = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news", {
    headers: { authorization: "Bearer wrong" },
  }), "secret", ingest, logger);

  assert.equal(missing.status, 401);
  assert.equal(unconfigured.status, 401);
  assert.equal(incorrect.status, 401);
  assert.equal(ingestCalls, 0);
  assert.deepEqual(entries, []);
});

test("news cron returns a concise summary and logs counts on success", async () => {
  const { entries, logger } = makeLogger();
  const response = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news", {
    headers: { authorization: "Bearer secret" },
  }), "secret", async () => makeReport({ updatedRows: 1 }), logger);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, fetched: 4, inserted: 2, updated: 1, failed: 0 });
  assert.deepEqual(entries, [["News cron ingestion completed.", { fetched: 4, inserted: 2, updated: 1, failed: 0 }]]);
});

test("authenticated diagnostics log execution times and aggregate counts only", async () => {
  const { entries, logger } = makeLogger();
  const response = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news?diagnostics=1", {
    headers: { authorization: "Bearer secret" },
  }), "secret", async () => makeReport({
    recent: 3,
    filtered: 1,
    inserted: 2,
    updatedRows: 1,
    errors: ["private article body and provider-secret-details"],
  }), logger);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, fetched: 4, inserted: 2, updated: 1, failed: 0 });
  assert.equal(entries.length, 3);
  const started = entries[0]?.[1] as { startedAt: string };
  const completed = entries[1]?.[1] as Record<string, unknown>;
  assert.equal(entries[0]?.[0], "News cron diagnostics started.");
  assert.match(started.startedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(entries[1]?.[0], "News cron diagnostics completed.");
  assert.match(String(completed.startedAt), /^\d{4}-\d{2}-\d{2}T/);
  assert.match(String(completed.endedAt), /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(typeof completed.durationMs, "number");
  assert.deepEqual({
    fetched: completed.fetched,
    recent: completed.recent,
    filtered: completed.filtered,
    inserted: completed.inserted,
    updated: completed.updated,
    failed: completed.failed,
  }, { fetched: 4, recent: 3, filtered: 1, inserted: 2, updated: 1, failed: 0 });
  assert.doesNotMatch(JSON.stringify(entries), /private article body|provider-secret-details|Bearer secret/);
});

test("diagnostics remain behind Bearer authorization and record thrown failures safely", async () => {
  const { entries, logger } = makeLogger();
  const unauthenticated = await handleNewsIngestionCron(
    new Request("https://example.test/api/cron/news?diagnostics=1"),
    "secret",
    async () => makeReport(),
    logger,
  );
  const failed = await handleNewsIngestionCron(new Request("https://example.test/api/cron/news?diagnostics=1", {
    headers: { authorization: "Bearer secret" },
  }), "secret", async () => {
    throw new Error("private service credential detail");
  }, logger);

  assert.equal(unauthenticated.status, 401);
  assert.equal(failed.status, 503);
  assert.equal(entries.length, 3);
  const completed = entries[1]?.[1] as Record<string, unknown>;
  assert.equal(entries[1]?.[0], "News cron diagnostics completed.");
  assert.match(String(completed.startedAt), /^\d{4}-\d{2}-\d{2}T/);
  assert.match(String(completed.endedAt), /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(typeof completed.durationMs, "number");
  assert.deepEqual({
    fetched: completed.fetched,
    recent: completed.recent,
    filtered: completed.filtered,
    inserted: completed.inserted,
    updated: completed.updated,
    failed: completed.failed,
  }, { fetched: 0, recent: 0, filtered: 0, inserted: 0, updated: 0, failed: 1 });
  assert.doesNotMatch(JSON.stringify(entries), /private service credential detail/);
});

test("news cron sanitizes partial and thrown ingestion failures", async () => {
  const { entries, logger } = makeLogger();
  const request = new Request("https://example.test/api/cron/news", {
    headers: { authorization: "Bearer secret" },
  });
  const partial = await handleNewsIngestionCron(request, "secret", async () => makeReport({
    failed: 1,
    errors: ["provider-secret-details"],
  }), logger);
  const thrown = await handleNewsIngestionCron(request, "secret", async () => {
    throw new Error("service-role-key-details");
  }, logger);
  const partialBody = JSON.stringify(await partial.json());
  const thrownBody = JSON.stringify(await thrown.json());
  const logged = JSON.stringify(entries);

  assert.equal(partial.status, 503);
  assert.equal(thrown.status, 503);
  assert.match(partialBody, /News ingestion completed with failures/);
  assert.match(thrownBody, /News ingestion failed/);
  assert.doesNotMatch(partialBody + thrownBody + logged, /provider-secret-details|service-role-key-details/);
});