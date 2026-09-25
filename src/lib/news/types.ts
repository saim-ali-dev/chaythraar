export type NormalizedNewsItem = {
  title: string;
  summary: string | null;
  headline: string | null;
  summary_short: string | null;
  original_title: string;
  original_language: string;
  source: string;
  source_url: string;
  image_url: string | null;
  published_at: string;
  category: string;
};

export type NewsSourceAdapter = {
  name: string;
  fetchItems: () => Promise<unknown[]>;
  normalizeItem: (rawItem: unknown) => NormalizedNewsItem | null;
};

export type NewsIngestionReport = {
  discovered: number;
  normalized: number;
  new: number;
  already_existing: number;
  inserted: number;
  skipped: number;
  failed: number;
  duplicates: number;
  errors: string[];
  summarized: number;
  summarization_skipped: number;
  summarization_failed: number;
};
